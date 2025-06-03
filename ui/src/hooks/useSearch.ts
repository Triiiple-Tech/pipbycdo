import { useState, useEffect, useCallback } from 'react';

// Custom hook for debounced search
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Search analytics interface
export interface SearchAnalytics {
  query: string;
  timestamp: Date;
  resultsCount: number;
  selectedResult?: string;
  searchTime: number;
  searchType: 'fuzzy' | 'exact' | 'filtered';
}

// Search analytics hook
export function useSearchAnalytics() {
  const [analytics, setAnalytics] = useState<SearchAnalytics[]>([]);

  const logSearch = useCallback((data: Omit<SearchAnalytics, 'timestamp'>) => {
    const analyticsEntry: SearchAnalytics = {
      ...data,
      timestamp: new Date()
    };
    
    setAnalytics(prev => {
      const updated = [analyticsEntry, ...prev].slice(0, 100); // Keep last 100 searches
      localStorage.setItem('pip-search-analytics', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getAnalyticsSummary = useCallback(() => {
    if (analytics.length === 0) return null;

    const totalSearches = analytics.length;
    const avgResultsCount = analytics.reduce((sum, a) => sum + a.resultsCount, 0) / totalSearches;
    const avgSearchTime = analytics.reduce((sum, a) => sum + a.searchTime, 0) / totalSearches;
    const mostCommonQueries = analytics
      .reduce((acc, a) => {
        acc[a.query] = (acc[a.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalSearches,
      avgResultsCount: Math.round(avgResultsCount * 100) / 100,
      avgSearchTime: Math.round(avgSearchTime * 100) / 100,
      mostCommonQueries: Object.entries(mostCommonQueries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([query, count]) => ({ query, count }))
    };
  }, [analytics]);

  // Load analytics from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pip-search-analytics');
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
        setAnalytics(parsed);
      } catch (error) {
        console.error('Failed to parse search analytics:', error);
      }
    }
  }, []);

  return {
    analytics,
    logSearch,
    getAnalyticsSummary
  };
}

// Advanced search filters
export interface AdvancedSearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  agents?: string[];
  messageTypes?: ('user' | 'agent')[];
  hasAttachments?: boolean;
  contentLength?: {
    min?: number;
    max?: number;
  };
  keywords?: string[];
  excludeKeywords?: string[];
}

// Text highlighting utility
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

// Export search results utilities
export class SearchExporter {
  static exportAsJSON(results: any[], filename?: string) {
    const data = JSON.stringify(results, null, 2);
    this.downloadFile(data, filename || `search-results-${Date.now()}.json`, 'application/json');
  }

  static exportAsCSV(results: any[], filename?: string) {
    if (results.length === 0) return;

    const headers = Object.keys(results[0]);
    const csvContent = [
      headers.join(','),
      ...results.map(row => 
        headers.map(header => {
          const value = row[header];
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, filename || `search-results-${Date.now()}.csv`, 'text/csv');
  }

  static exportAsMarkdown(results: any[], filename?: string) {
    if (results.length === 0) return;

    const markdown = [
      '# Search Results',
      `Generated on: ${new Date().toLocaleString()}`,
      `Total results: ${results.length}`,
      '',
      ...results.map((result, index) => [
        `## Result ${index + 1}: ${result.title || 'Untitled'}`,
        `**Type:** ${result.type}`,
        `**Score:** ${result.score}`,
        result.timestamp ? `**Date:** ${new Date(result.timestamp).toLocaleString()}` : '',
        result.metadata?.agent ? `**Agent:** ${result.metadata.agent}` : '',
        '',
        result.content || '',
        '',
        '---',
        ''
      ].filter(Boolean))
    ].flat().join('\n');

    this.downloadFile(markdown, filename || `search-results-${Date.now()}.md`, 'text/markdown');
  }

  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Fuzzy search implementation with advanced scoring
export class FuzzySearch {
  static search(text: string, query: string, options: {
    caseSensitive?: boolean;
    includeScore?: boolean;
    threshold?: number;
  } = {}): number | { score: number; indices: number[] } {
    const {
      caseSensitive = false,
      includeScore = false,
      threshold = 0.1
    } = options;

    if (!query) return includeScore ? { score: 1, indices: [] } : 1;

    const textToSearch = caseSensitive ? text : text.toLowerCase();
    const queryToMatch = caseSensitive ? query : query.toLowerCase();

    // Exact match gets highest score
    if (textToSearch.includes(queryToMatch)) {
      const startIndex = textToSearch.indexOf(queryToMatch);
      const indices = Array.from({ length: queryToMatch.length }, (_, i) => startIndex + i);
      return includeScore ? { score: 0.95, indices } : 0.95;
    }

    // Fuzzy matching
    let score = 0;
    let queryIndex = 0;
    const matchedIndices: number[] = [];

    for (let i = 0; i < textToSearch.length && queryIndex < queryToMatch.length; i++) {
      if (textToSearch[i] === queryToMatch[queryIndex]) {
        score += 1 / (1 + i - queryIndex);
        matchedIndices.push(i);
        queryIndex++;
      }
    }

    const finalScore = queryIndex === queryToMatch.length ? score / queryToMatch.length : 0;
    
    if (finalScore < threshold) {
      return includeScore ? { score: 0, indices: [] } : 0;
    }

    return includeScore ? { score: finalScore, indices: matchedIndices } : finalScore;
  }

  static searchMultiple<T>(
    items: T[],
    query: string,
    options: {
      keys: (keyof T)[];
      threshold?: number;
      limit?: number;
    }
  ): Array<T & { score: number; matchedFields: string[] }> {
    const { keys, threshold = 0.1, limit } = options;

    const results = items
      .map(item => {
        let maxScore = 0;
        const matchedFields: string[] = [];

        keys.forEach(key => {
          const value = item[key];
          if (typeof value === 'string') {
            const score = this.search(value, query, { threshold });
            if (typeof score === 'number' && score > maxScore) {
              maxScore = score;
              if (score > threshold) {
                matchedFields.push(String(key));
              }
            }
          }
        });

        return {
          ...item,
          score: maxScore,
          matchedFields
        };
      })
      .filter(item => item.score > threshold)
      .sort((a, b) => b.score - a.score);

    return limit ? results.slice(0, limit) : results;
  }
}