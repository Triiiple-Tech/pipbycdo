import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  FileText,
  Calculator,
  Search,
  AlertTriangle,
  CheckCircle,
  Users,
  Zap,
  BrainCircuit,
  ClipboardList,
  Target,
  TrendingUp,
  FileCheck,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';

export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
  category: 'analysis' | 'generation' | 'validation' | 'scope' | 'estimation' | 'collaboration';
  icon: React.ElementType;
  description?: string;
  isAdmin?: boolean; // Admin-only templates
  tags?: string[];
}

export interface PromptTemplatesDropdownProps {
  templates?: PromptTemplate[];
  onSelectTemplate: (template: PromptTemplate) => void;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
  showCategories?: boolean;
  isAdminMode?: boolean;
}

// Default prompt templates based on the UX Master Doc
const DEFAULT_TEMPLATES: PromptTemplate[] = [
  // Analysis Templates
  {
    id: 'summarize-scope',
    label: 'Summarize Scope',
    prompt: 'Please analyze the uploaded documents and provide a comprehensive scope summary, highlighting key project objectives, deliverables, and requirements.',
    category: 'analysis',
    icon: FileText,
    description: 'Generate a detailed scope summary from documents',
    tags: ['scope', 'summary', 'analysis'],
  },
  {
    id: 'identify-missing-info',
    label: 'Identify Missing Info',
    prompt: 'Review the provided documents and identify any missing information, gaps in requirements, or areas that need clarification for project completion.',
    category: 'analysis',
    icon: Search,
    description: 'Find gaps and missing requirements',
    tags: ['gaps', 'requirements', 'missing'],
  },
  {
    id: 'extract-deliverables',
    label: 'Extract Deliverables',
    prompt: 'Extract and list all project deliverables mentioned in the documents, categorizing them by type and priority.',
    category: 'analysis',
    icon: ClipboardList,
    description: 'List all project deliverables',
    tags: ['deliverables', 'extract', 'categorize'],
  },

  // Generation Templates
  {
    id: 'generate-rfi',
    label: 'Generate RFI',
    prompt: 'Based on the analyzed documents, generate a comprehensive Request for Information (RFI) addressing unclear requirements and necessary clarifications.',
    category: 'generation',
    icon: MessageSquare,
    description: 'Create RFI for unclear requirements',
    tags: ['rfi', 'questions', 'clarification'],
  },
  {
    id: 'create-sow',
    label: 'Create SOW Draft',
    prompt: 'Generate a Statement of Work (SOW) draft based on the project scope and requirements identified in the documents.',
    category: 'generation',
    icon: FileCheck,
    description: 'Draft a comprehensive SOW',
    tags: ['sow', 'statement', 'work'],
  },
  {
    id: 'generate-timeline',
    label: 'Generate Timeline',
    prompt: 'Create a project timeline with milestones and dependencies based on the scope and deliverables identified.',
    category: 'generation',
    icon: TrendingUp,
    description: 'Create project timeline and milestones',
    tags: ['timeline', 'milestones', 'schedule'],
  },

  // Validation Templates
  {
    id: 'validate-completeness',
    label: 'Validate Completeness',
    prompt: 'Perform a completeness check on the project documentation and highlight any missing standard sections or information.',
    category: 'validation',
    icon: CheckCircle,
    description: 'Check document completeness',
    tags: ['validation', 'completeness', 'check'],
  },
  {
    id: 'risk-assessment',
    label: 'Risk Assessment',
    prompt: 'Analyze the project documents and identify potential risks, dependencies, and mitigation strategies.',
    category: 'validation',
    icon: AlertTriangle,
    description: 'Identify project risks and mitigation',
    tags: ['risk', 'assessment', 'mitigation'],
  },

  // Scope Templates
  {
    id: 'scope-breakdown',
    label: 'Scope Breakdown',
    prompt: 'Break down the project scope into detailed work packages and sub-deliverables for better estimation and planning.',
    category: 'scope',
    icon: Target,
    description: 'Detailed scope work breakdown',
    tags: ['scope', 'breakdown', 'wbs'],
  },

  // Estimation Templates
  {
    id: 'effort-estimation',
    label: 'Effort Estimation',
    prompt: 'Provide effort estimates for the identified deliverables, including time, resources, and complexity analysis.',
    category: 'estimation',
    icon: Calculator,
    description: 'Estimate project effort and resources',
    tags: ['estimation', 'effort', 'resources'],
  },
  {
    id: 'cost-analysis',
    label: 'Cost Analysis',
    prompt: 'Analyze the project requirements and provide a detailed cost breakdown including labor, materials, and overhead.',
    category: 'estimation',
    icon: TrendingUp,
    description: 'Detailed cost breakdown analysis',
    tags: ['cost', 'analysis', 'budget'],
  },

  // Collaboration Templates
  {
    id: 'stakeholder-summary',
    label: 'Stakeholder Summary',
    prompt: 'Create a summary of key stakeholders, their roles, and communication requirements based on the project documentation.',
    category: 'collaboration',
    icon: Users,
    description: 'Identify stakeholders and roles',
    tags: ['stakeholders', 'roles', 'communication'],
  },
];

const CATEGORY_CONFIG = {
  analysis: {
    label: 'Analysis',
    icon: BrainCircuit,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  generation: {
    label: 'Generation',
    icon: Sparkles,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  },
  validation: {
    label: 'Validation',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  scope: {
    label: 'Scope',
    icon: Target,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  },
  estimation: {
    label: 'Estimation',
    icon: Calculator,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  collaboration: {
    label: 'Collaboration',
    icon: Users,
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
  },
};

export function PromptTemplatesDropdown({
  templates = DEFAULT_TEMPLATES,
  onSelectTemplate,
  disabled = false,
  className,
  size = 'sm',
  variant = 'ghost',
  showCategories = true,
  isAdminMode = false,
}: PromptTemplatesDropdownProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates based on admin mode and search query
  const filteredTemplates = templates.filter(template => {
    const adminFilter = !template.isAdmin || (template.isAdmin && isAdminMode);
    const searchFilter = searchQuery === '' || 
      template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return adminFilter && searchFilter;
  });

  // Group templates by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, PromptTemplate[]>);

  const sizeClasses = {
    default: 'h-10 px-4',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6 text-lg',
    icon: 'h-8 w-8 p-0',
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    onSelectTemplate(template);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          className={cn(
            sizeClasses[size],
            'gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:ring-cdo-red',
            className
          )}
          aria-label="Select prompt template"
        >
          <Zap className="w-4 h-4 text-cdo-red" />
          <span className="hidden sm:inline">Templates</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-80 max-h-96 overflow-y-auto" 
        align="start"
        aria-label="Prompt templates menu"
      >
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2">
          <Sparkles className="w-4 h-4 text-cdo-red" />
          Smart Query Templates
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Search Input */}
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-cdo-red focus:border-cdo-red"
            />
          </div>
        </div>
        <DropdownMenuSeparator />

        {showCategories ? (
          // Categorized view
          Object.entries(templatesByCategory).map(([category, categoryTemplates]) => {
            const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
            const CategoryIcon = categoryConfig.icon;

            return (
              <DropdownMenuGroup key={category}>
                <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  <CategoryIcon className="w-3 h-3" />
                  {categoryConfig.label}
                </DropdownMenuLabel>
                
                {categoryTemplates.map((template, index) => {
                  const TemplateIcon = template.icon;
                  const isTopTemplate = template.id === 'summarize-scope' || template.id === 'generate-rfi' || template.id === 'identify-missing-info';
                  const shortcutKey = template.id === 'summarize-scope' ? '1' : template.id === 'generate-rfi' ? '2' : template.id === 'identify-missing-info' ? '3' : null;
                  
                  return (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="px-3 py-2 cursor-pointer focus:bg-cdo-red/10 focus:text-cdo-red group"
                      aria-label={`Select template: ${template.label}`}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <TemplateIcon className="w-4 h-4 mt-0.5 text-slate-500 group-hover:text-cdo-red transition-colors" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-sm group-hover:text-cdo-red transition-colors">
                              {template.label}
                            </span>
                            <div className="flex items-center gap-2">
                              {shortcutKey && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                                    ⌘{shortcutKey}
                                  </kbd>
                                </div>
                              )}
                              {template.isAdmin && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                >
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                          {template.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {template.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs px-1.5 py-0 border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1.5 py-0 border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                                >
                                  +{template.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            );
          })
        ) : (
          // Flat view
          filteredTemplates.map((template, index) => {
            const TemplateIcon = template.icon;
            const categoryConfig = CATEGORY_CONFIG[template.category];
            const shortcutKey = template.id === 'summarize-scope' ? '1' : template.id === 'generate-rfi' ? '2' : template.id === 'identify-missing-info' ? '3' : null;
            
            return (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="px-3 py-2 cursor-pointer focus:bg-cdo-red/10 focus:text-cdo-red group"
                aria-label={`Select template: ${template.label}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <TemplateIcon className="w-4 h-4 text-slate-500 group-hover:text-cdo-red transition-colors" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm group-hover:text-cdo-red transition-colors">
                        {template.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {shortcutKey && (
                          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono text-slate-400">
                            ⌘{shortcutKey}
                          </kbd>
                        )}
                        <Badge className={cn('text-xs px-1.5 py-0.5', categoryConfig.color)}>
                          {categoryConfig.label}
                        </Badge>
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })
        )}

        {isAdminMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="px-3 py-2 cursor-pointer text-cdo-red hover:bg-cdo-red/10 font-medium"
              aria-label="Manage templates in admin panel"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Manage Templates
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DEFAULT_TEMPLATES, CATEGORY_CONFIG };
