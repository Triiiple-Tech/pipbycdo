// Template validation utilities
import { PromptTemplate } from '@/components/pip/PromptTemplatesDropdown';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTemplate(template: Partial<PromptTemplate>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!template.label?.trim()) {
    errors.push('Template label is required');
  }

  if (!template.prompt?.trim()) {
    errors.push('Template prompt is required');
  }

  if (!template.category) {
    errors.push('Template category is required');
  }

  if (!template.icon) {
    errors.push('Template icon is required');
  }

  // Length validations
  if (template.label && template.label.length > 50) {
    warnings.push('Label should be under 50 characters for better display');
  }

  if (template.prompt && template.prompt.length < 20) {
    warnings.push('Prompt seems too short - consider adding more detail');
  }

  if (template.prompt && template.prompt.length > 500) {
    warnings.push('Prompt is very long - consider breaking it down');
  }

  if (template.description && template.description.length > 100) {
    warnings.push('Description should be under 100 characters');
  }

  // Content quality checks
  if (template.prompt && !template.prompt.includes('.')) {
    warnings.push('Prompt should include proper punctuation');
  }

  if (template.tags && template.tags.length > 5) {
    warnings.push('Consider using fewer than 5 tags for better organization');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function generateTemplatePreview(template: PromptTemplate): string {
  return `Template: ${template.label}\nCategory: ${template.category}\nPrompt: ${template.prompt}\n\nThis template will help you: ${template.description || 'Achieve your project goals'}`;
}

export function getTemplateUsageStats(templateId: string): Promise<{
  usageCount: number;
  lastUsed: Date | null;
  averageRating: number;
}> {
  // Placeholder for analytics - would connect to backend
  return Promise.resolve({
    usageCount: Math.floor(Math.random() * 100),
    lastUsed: new Date(),
    averageRating: 4.2 + Math.random() * 0.8,
  });
}
