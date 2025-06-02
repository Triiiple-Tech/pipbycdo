import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  FileText,
  Calculator,
  Search,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  BrainCircuit,
  ClipboardList,
  TrendingUp,
  FileCheck,
  MessageSquare,
} from 'lucide-react';
import { PromptTemplate, CATEGORY_CONFIG } from './PromptTemplatesDropdown';

export interface TemplateManagerProps {
  templates: PromptTemplate[];
  onUpdateTemplates: (templates: PromptTemplate[]) => void;
  className?: string;
}

const ICON_OPTIONS = [
  { value: 'FileText', label: 'Document', icon: FileText },
  { value: 'Calculator', label: 'Calculator', icon: Calculator },
  { value: 'Search', label: 'Search', icon: Search },
  { value: 'AlertTriangle', label: 'Warning', icon: AlertTriangle },
  { value: 'CheckCircle', label: 'Check', icon: CheckCircle },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'BrainCircuit', label: 'Brain', icon: BrainCircuit },
  { value: 'ClipboardList', label: 'List', icon: ClipboardList },
  { value: 'TrendingUp', label: 'Trending', icon: TrendingUp },
  { value: 'FileCheck', label: 'File Check', icon: FileCheck },
  { value: 'MessageSquare', label: 'Message', icon: MessageSquare },
  { value: 'Sparkles', label: 'Sparkles', icon: Sparkles },
];

const emptyTemplate: Omit<PromptTemplate, 'id' | 'icon'> & { iconName: string } = {
  label: '',
  prompt: '',
  category: 'analysis',
  iconName: 'FileText',
  description: '',
  isAdmin: false,
  tags: [],
};

export function TemplateManager({ templates, onUpdateTemplates, className }: TemplateManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState<Omit<PromptTemplate, 'id' | 'icon'> & { id?: string; iconName: string }>(emptyTemplate);
  const [newTag, setNewTag] = useState('');

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({ ...emptyTemplate, tags: [] });
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    const iconName = ICON_OPTIONS.find(opt => opt.icon === template.icon)?.value || 'FileText';
    setFormData({
      ...template,
      iconName, // Store icon name instead of component
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    onUpdateTemplates(updatedTemplates);
  };

  const handleSaveTemplate = () => {
    if (!formData.label.trim() || !formData.prompt.trim()) {
      return; // Validation - could add proper error states
    }

    // Find the icon component from the options
    const selectedIcon = ICON_OPTIONS.find(opt => opt.value === formData.iconName)?.icon || FileText;

    const templateData: PromptTemplate = {
      ...formData,
      id: editingTemplate?.id || `custom-${Date.now()}`,
      icon: selectedIcon,
      label: formData.label.trim(),
      prompt: formData.prompt.trim(),
      description: formData.description?.trim() || '',
      tags: formData.tags || [],
    };

    let updatedTemplates: PromptTemplate[];
    if (editingTemplate) {
      // Update existing template
      updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id ? templateData : t
      );
    } else {
      // Add new template
      updatedTemplates = [...templates, templateData];
    }

    onUpdateTemplates(updatedTemplates);
    setIsDialogOpen(false);
    setFormData(emptyTemplate);
    setEditingTemplate(null);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove),
    }));
  };

  const handleIconChange = (iconName: string) => {
    setFormData(prev => ({
      ...prev,
      iconName,
    }));
  };

  // Group templates by category for display
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, PromptTemplate[]>);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cdo-red" />
            Template Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create and manage prompt templates for enhanced productivity
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleCreateTemplate}
              className="bg-cdo-red hover:bg-cdo-red/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? 'Update the template details below.' 
                  : 'Create a custom prompt template for repeated use.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Template Label */}
              <div className="space-y-2">
                <Label htmlFor="template-label">Template Label *</Label>
                <Input
                  id="template-label"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Summarize Scope"
                  className="focus-visible:ring-cdo-red"
                />
              </div>

              {/* Category and Icon */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      category: value as PromptTemplate['category']
                    }))}
                  >
                    <SelectTrigger className="focus:ring-cdo-red">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-icon">Icon</Label>
                  <Select
                    value={formData.iconName || 'FileText'}
                    onValueChange={handleIconChange}
                  >
                    <SelectTrigger className="focus:ring-cdo-red">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this template does"
                  className="focus-visible:ring-cdo-red"
                />
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="template-prompt">Prompt Text *</Label>
                <Textarea
                  id="template-prompt"
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Enter the prompt text that will be inserted when this template is selected..."
                  className="min-h-[120px] focus-visible:ring-cdo-red"
                  maxLength={2000}
                />
                <div className="text-xs text-slate-500 text-right">
                  {formData.prompt.length}/2000
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    className="focus-visible:ring-cdo-red"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    Add
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Template Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="admin-template"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                  className="rounded border-gray-300 text-cdo-red focus:ring-cdo-red"
                />
                <Label htmlFor="admin-template" className="text-sm">
                  Admin-only template (only visible in admin mode)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTemplate}
                disabled={!formData.label.trim() || !formData.prompt.trim()}
                className="bg-cdo-red hover:bg-cdo-red/90 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-6">
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => {
            const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
            const CategoryIcon = categoryConfig.icon;

            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CategoryIcon className="w-4 h-4" />
                    {categoryConfig.label}
                    <Badge variant="outline" className="ml-auto">
                      {categoryTemplates.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryTemplates.map((template) => {
                    const TemplateIcon = template.icon;
                    return (
                      <div
                        key={template.id}
                        className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <TemplateIcon className="w-4 h-4 mt-1 text-slate-500" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{template.label}</span>
                            {template.isAdmin && (
                              <Badge variant="secondary" className="text-xs">
                                Admin
                              </Badge>
                            )}
                          </div>
                          
                          {template.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                              {template.description}
                            </p>
                          )}
                          
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
                            {template.prompt}
                          </p>
                          
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex gap-1">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs px-1.5 py-0"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                  +{template.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTemplate(template)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{template.label}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
