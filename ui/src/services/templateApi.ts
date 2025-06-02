// Template API service
import { PromptTemplate } from '@/components/pip/PromptTemplatesDropdown';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface TemplateResponse {
  templates: PromptTemplate[];
}

interface SingleTemplateResponse {
  template: PromptTemplate;
  warning?: string;
}

interface DeleteResponse {
  message: string;
  warning?: string;
}

export class TemplateApiService {
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get all prompt templates
   * @param admin - Include admin-only templates
   */
  static async getTemplates(admin: boolean = false): Promise<PromptTemplate[]> {
    const params = new URLSearchParams();
    if (admin) {
      params.append('admin', 'true');
    }
    
    const response = await this.request<TemplateResponse>(
      `/templates?${params.toString()}`
    );
    
    return response.templates;
  }

  /**
   * Create a new prompt template
   */
  static async createTemplate(template: Omit<PromptTemplate, 'id'> & { id?: string }): Promise<PromptTemplate> {
    const response = await this.request<SingleTemplateResponse>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
    
    if (response.warning) {
      console.warn('Template API Warning:', response.warning);
    }
    
    return response.template;
  }

  /**
   * Update an existing prompt template
   */
  static async updateTemplate(templateId: string, template: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const response = await this.request<SingleTemplateResponse>(`/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
    
    if (response.warning) {
      console.warn('Template API Warning:', response.warning);
    }
    
    return response.template;
  }

  /**
   * Delete a prompt template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    const response = await this.request<DeleteResponse>(`/templates/${templateId}`, {
      method: 'DELETE',
    });
    
    if (response.warning) {
      console.warn('Template API Warning:', response.warning);
    }
  }

  /**
   * Get template usage analytics (placeholder for future implementation)
   */
  static async getTemplateAnalytics(templateId?: string): Promise<any> {
    // TODO: Implement template usage tracking
    return {
      totalUsage: 0,
      recentUsage: 0,
      popularTemplates: [],
    };
  }
}

// Export as default and named export for flexibility
export default TemplateApiService;
