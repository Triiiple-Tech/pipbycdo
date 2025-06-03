import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Clock, Bookmark, Filter, Download, Trash2, Settings, FileText, User, Bot, Calendar, Hash } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Message } from './MessageBubble';
import { useDebounce, useSearchAnalytics, AdvancedSearchFilters, SearchExporter, FuzzySearch } from '../../hooks/useSearch';

export interface SearchResult {
  id: string;
  type: 'message' | 'file' | 'template' | 'project';
  title: string;
  content: string;
  timestamp?: Date;
  score: number;
  highlights?: string[];
  metadata?: Record<string, any>;
}

export interface SearchFilter {
  type?: string[];
  dateRange?: { start: Date; end: Date };
  agent?: string[];
  keyword?: string[];
  hasAttachments?: boolean;
  messageType?: ('user' | 'agent')[];
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  onSelectResult?: (result: SearchResult) => void;
  className?: string;
}

export function GlobalSearch({
  isOpen,
  onOpenChange,
  messages,
  onSelectResult,
  className
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [activeFilters, setActiveFilters] = useState<SearchFilter>({});
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [useRealTimeSearch, setUseRealTimeSearch] = useState(true);

  // Use debounced query for real-time search
  const debouncedQuery = useDebounce(query, useRealTimeSearch ? 300 : 0);
  const { logSearch, getAnalyticsSummary } = useSearchAnalytics();

  // Load search history and saved searches from localStorage
  useEffect(() => {
    const history = localStorage.getItem('pip-search-history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
    
    const saved = localStorage.getItem('pip-saved-searches');
    if (saved) {
      setSavedSearches(JSON.parse(saved).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastUsed: new Date(s.lastUsed)
      })));
    }
  }, []);

  // Search through messages with enhanced fuzzy matching
  const searchResults = useMemo(() => {
    const searchQuery = useRealTimeSearch ? debouncedQuery : query;
    if (!searchQuery.trim()) return [];

    const startTime = performance.now();
    const results: SearchResult[] = [];

    // Use enhanced fuzzy search
    const searchItems = messages.map((message, index) => ({
      id: `message-${index}`,
      content: message.content,
      agent: message.agent || 'User',
      timestamp: message.timestamp,
      attachments: message.attachments,
      index
    }));

    const fuzzyResults = FuzzySearch.searchMultiple(searchItems, searchQuery, {
      keys: ['content', 'agent'],
      threshold: 0.1,
      limit: 50
    });

    fuzzyResults.forEach(result => {
      // Apply additional filters
      let passesFilters = true;

      // Date range filter
      if (activeFilters.dateRange && result.timestamp) {
        const messageDate = new Date(result.timestamp);
        if (messageDate < activeFilters.dateRange.start || messageDate > activeFilters.dateRange.end) {
          passesFilters = false;
        }
      }

      // Agent filter
      if (activeFilters.agent && activeFilters.agent.length > 0) {
        if (!activeFilters.agent.includes(result.agent)) {
          passesFilters = false;
        }
      }

      // Message type filter
      if (activeFilters.messageType && activeFilters.messageType.length > 0) {
        const messageType = result.agent === 'User' ? 'user' : 'agent';
        if (!activeFilters.messageType.includes(messageType)) {
          passesFilters = false;
        }
      }

      // Attachments filter
      if (activeFilters.hasAttachments !== undefined) {
        const hasAttachments = result.attachments && result.attachments.length > 0;
        if (activeFilters.hasAttachments !== hasAttachments) {
          passesFilters = false;
        }
      }

      if (passesFilters) {
        results.push({
          id: result.id,
          type: 'message',
          title: `Message from ${result.agent}`,
          content: result.content,
          timestamp: result.timestamp,
          score: result.score,
          highlights: result.matchedFields,
          metadata: {
            agent: result.agent,
            attachments: result.attachments?.length || 0,
            messageIndex: result.index
          }
        });
      }
    });

    const searchTime = performance.now() - startTime;
    
    // Log search analytics
    if (searchQuery.trim()) {
      logSearch({
        query: searchQuery,
        resultsCount: results.length,
        searchTime,
        searchType: 'fuzzy'
      });
    }

    return results;
  }, [useRealTimeSearch ? debouncedQuery : query, messages, activeFilters, logSearch]);

  // Add to search history
  const addToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('pip-search-history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Save search query
  const saveSearch = useCallback((name: string) => {
    if (!query.trim() || !name.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query,
      filters: activeFilters,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 1
    };

    const updated = [newSearch, ...savedSearches].slice(0, 20);
    setSavedSearches(updated);
    localStorage.setItem('pip-saved-searches', JSON.stringify(updated));
  }, [query, activeFilters, savedSearches]);

  // Export search results with multiple formats
  const exportResults = useCallback((format: 'csv' | 'json' | 'markdown') => {
    if (searchResults.length === 0) return;

    const exportData = searchResults.map(result => ({
      type: result.type,
      title: result.title,
      content: result.content,
      timestamp: result.timestamp?.toISOString(),
      score: Math.round(result.score * 1000) / 1000,
      agent: result.metadata?.agent,
      attachments: result.metadata?.attachments || 0
    }));

    switch (format) {
      case 'json':
        SearchExporter.exportAsJSON(exportData);
        break;
      case 'csv':
        SearchExporter.exportAsCSV(exportData);
        break;
      case 'markdown':
        SearchExporter.exportAsMarkdown(searchResults);
        break;
    }
  }, [searchResults]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      addToHistory(query);
      // Log search analytics
      console.log('Search performed:', { query, resultsCount: searchResults.length });
    }
  }, [query, addToHistory, searchResults.length]);

  // Handle result selection
  const handleSelectResult = useCallback((result: SearchResult) => {
    onSelectResult?.(result);
    onOpenChange(false);
    setQuery(''); // Clear search
  }, [onSelectResult, onOpenChange]);

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search messages, files, templates..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !useRealTimeSearch) {
              handleSearch();
            }
          }}
        />
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className={cn("h-8 px-2", isAdvancedMode && "bg-accent")}
            title="Advanced Filters"
          >
            <Filter className="h-3 w-3" />
          </Button>
          {searchResults.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportResults('json')}
                className="h-8 px-2"
                title="Export as JSON"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveSearch(prompt('Save search as:') || '')}
                className="h-8 px-2"
                title="Save Search"
              >
                <Bookmark className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isAdvancedMode && (
        <div className="border-b bg-muted/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              <Label htmlFor="realtime-search" className="text-xs">Real-time</Label>
              <Switch
                id="realtime-search"
                checked={useRealTimeSearch}
                onCheckedChange={setUseRealTimeSearch}
                size="sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Message Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Message Type</Label>
              <div className="flex gap-2">
                <Badge
                  variant={activeFilters.messageType?.includes('user') ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    const current = activeFilters.messageType || [];
                    const updated = current.includes('user')
                      ? current.filter(t => t !== 'user')
                      : [...current, 'user'];
                    setActiveFilters(prev => ({ ...prev, messageType: updated.length ? updated : undefined }));
                  }}
                >
                  <User className="h-3 w-3 mr-1" />
                  User
                </Badge>
                <Badge
                  variant={activeFilters.messageType?.includes('agent') ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    const current = activeFilters.messageType || [];
                    const updated = current.includes('agent')
                      ? current.filter(t => t !== 'agent')
                      : [...current, 'agent'];
                    setActiveFilters(prev => ({ ...prev, messageType: updated.length ? updated : undefined }));
                  }}
                >
                  <Bot className="h-3 w-3 mr-1" />
                  Agent
                </Badge>
              </div>
            </div>

            {/* Attachments Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Attachments</Label>
              <div className="flex gap-2">
                <Badge
                  variant={activeFilters.hasAttachments === true ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    setActiveFilters(prev => ({ 
                      ...prev, 
                      hasAttachments: prev.hasAttachments === true ? undefined : true 
                    }));
                  }}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  With Files
                </Badge>
                <Badge
                  variant={activeFilters.hasAttachments === false ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    setActiveFilters(prev => ({ 
                      ...prev, 
                      hasAttachments: prev.hasAttachments === false ? undefined : false 
                    }));
                  }}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  Text Only
                </Badge>
              </div>
            </div>
          </div>

          {/* Export Options */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Export Results ({searchResults.length})</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportResults('json')}
                  className="text-xs"
                >
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportResults('csv')}
                  className="text-xs"
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportResults('markdown')}
                  className="text-xs"
                >
                  Markdown
                </Button>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {Object.keys(activeFilters).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveFilters({})}
              className="w-full text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      )}

      <CommandList className="max-h-[400px]">
        {query === '' && (
          <>
            {/* Search History */}
            {searchHistory.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {searchHistory.slice(0, 5).map((historyQuery, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => setQuery(historyQuery)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-3 w-3 opacity-50" />
                    <span>{historyQuery}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <CommandGroup heading="Saved Searches">
                {savedSearches.slice(0, 5).map((saved) => (
                  <CommandItem
                    key={saved.id}
                    onSelect={() => setQuery(saved.query)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-3 w-3 opacity-50" />
                      <span>{saved.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {saved.useCount}x
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Quick Stats */}
            {(() => {
              const analytics = getAnalyticsSummary();
              return analytics && (
                <CommandGroup heading="Search Analytics">
                  <div className="px-2 py-1 text-xs text-muted-foreground space-y-1">
                    <p>Total searches: {analytics.totalSearches}</p>
                    <p>Avg results: {analytics.avgResultsCount}</p>
                    <p>Avg time: {analytics.avgSearchTime}ms</p>
                  </div>
                </CommandGroup>
              );
            })()}
          </>
        )}

        {query !== '' && (
          <>
            <CommandEmpty>
              <div className="text-center py-6">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search terms or filters
                </p>
              </div>
            </CommandEmpty>
            
            {searchResults.length > 0 && (
              <CommandGroup heading={`Results (${searchResults.length})`}>
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelectResult(result)}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium truncate">{result.title}</span>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {(result.score * 100).toFixed(0)}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {result.metadata?.agent}
                        </Badge>
                        {result.metadata?.attachments > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-2 w-2 mr-1" />
                            {result.metadata.attachments}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 w-full">
                      {result.content}
                    </p>
                    {result.timestamp && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {result.timestamp.toLocaleDateString()} {result.timestamp.toLocaleTimeString()}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default GlobalSearch;