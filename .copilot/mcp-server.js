// Simplified MCP server implementation - compatible with standard Node.js
const fs = require('fs').promises;
const fs = require('fs').promises;
const path = require('path');

/**
 * PIP AI Model Context Protocol Server
 * Provides enhanced context and code generation capabilities for GitHub Copilot
 */
class PipAiMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pip-ai-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'pip://project-architecture',
            name: 'PIP AI Project Architecture',
            description: 'Complete project structure and component relationships',
            mimeType: 'text/markdown',
          },
          {
            uri: 'pip://api-endpoints',
            name: 'API Endpoints Reference',
            description: 'All available FastAPI endpoints and their specifications',
            mimeType: 'application/json',
          },
          {
            uri: 'pip://agent-workflows',
            name: 'Agent Workflows',
            description: 'Agent interaction patterns and workflows',
            mimeType: 'text/markdown',
          },
          {
            uri: 'pip://database-schema',
            name: 'Database Schema',
            description: 'Supabase database structure and relationships',
            mimeType: 'application/json',
          },
          {
            uri: 'pip://ui-components',
            name: 'UI Components Library',
            description: 'Available React components and their props',
            mimeType: 'text/markdown',
          },
        ],
      };
    });

    // Read specific resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'pip://project-architecture':
          return {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: await this.getProjectArchitecture(),
              },
            ],
          };

        case 'pip://api-endpoints':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.getApiEndpoints(), null, 2),
              },
            ],
          };

        case 'pip://agent-workflows':
          return {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: await this.getAgentWorkflows(),
              },
            ],
          };

        case 'pip://database-schema':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.getDatabaseSchema(), null, 2),
              },
            ],
          };

        case 'pip://ui-components':
          return {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: await this.getUiComponents(),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate-agent',
            description: 'Generate a new AI agent with proper structure and patterns',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Agent name (e.g., "ValidationAgent")',
                },
                purpose: {
                  type: 'string',
                  description: 'Agent purpose and responsibilities',
                },
                inputs: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Expected input data types',
                },
                outputs: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Expected output data types',
                },
              },
              required: ['name', 'purpose'],
            },
          },
          {
            name: 'generate-api-endpoint',
            description: 'Generate FastAPI endpoint with validation and documentation',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'API endpoint path (e.g., "/api/v1/documents")',
                },
                method: {
                  type: 'string',
                  enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                  description: 'HTTP method',
                },
                purpose: {
                  type: 'string',
                  description: 'Endpoint purpose and functionality',
                },
                requiresAuth: {
                  type: 'boolean',
                  description: 'Whether authentication is required',
                },
              },
              required: ['path', 'method', 'purpose'],
            },
          },
          {
            name: 'generate-react-component',
            description: 'Generate React component with TypeScript and best practices',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Component name in PascalCase',
                },
                type: {
                  type: 'string',
                  enum: ['page', 'layout', 'widget', 'form', 'modal'],
                  description: 'Component type',
                },
                purpose: {
                  type: 'string',
                  description: 'Component purpose and functionality',
                },
                props: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string' },
                      required: { type: 'boolean' },
                    },
                  },
                  description: 'Component props specification',
                },
              },
              required: ['name', 'type', 'purpose'],
            },
          },
          {
            name: 'analyze-project',
            description: 'Analyze project structure and suggest improvements',
            inputSchema: {
              type: 'object',
              properties: {
                focus: {
                  type: 'string',
                  enum: ['performance', 'security', 'architecture', 'testing', 'ui-ux'],
                  description: 'Analysis focus area',
                },
              },
              required: ['focus'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'generate-agent':
          return { content: [{ type: 'text', text: await this.generateAgent(args) }] };
        case 'generate-api-endpoint':
          return { content: [{ type: 'text', text: await this.generateApiEndpoint(args) }] };
        case 'generate-react-component':
          return { content: [{ type: 'text', text: await this.generateReactComponent(args) }] };
        case 'analyze-project':
          return { content: [{ type: 'text', text: await this.analyzeProject(args) }] };
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async getProjectArchitecture() {
    return `# PIP AI Project Architecture

## System Overview
PIP AI is a construction document analysis platform that uses AI agents to process documents and generate cost estimates.

## Core Components

### Backend (FastAPI)
- **API Layer**: RESTful endpoints for frontend integration
- **Agent System**: 8 specialized AI agents for document processing
- **Services**: Business logic and external integrations
- **Database**: Supabase/PostgreSQL for data persistence

### Frontend (React/TypeScript)
- **Pages**: Main application views and workflows
- **Components**: Reusable UI components with Tailwind CSS
- **Services**: API clients and business logic
- **State Management**: Context API for global state

### Agent Architecture
1. **FileReaderAgent**: Document text extraction and preprocessing
2. **ScopeAgent**: Project scope analysis and categorization
3. **TakeoffAgent**: Quantity calculations and measurements
4. **TradeMapperAgent**: Trade classification and mapping
5. **EstimatorAgent**: Cost calculation and pricing
6. **QAValidatorAgent**: Quality assurance and validation
7. **ExporterAgent**: Data formatting and export
8. **ManagerAgent**: Workflow orchestration

## Data Flow
1. Document upload → FileReaderAgent
2. Text extraction → ScopeAgent analysis
3. Scope data → TakeoffAgent calculations
4. Quantities → TradeMapperAgent classification
5. Trade data → EstimatorAgent pricing
6. Estimates → QAValidatorAgent validation
7. Validated data → ExporterAgent formatting
8. Final output → Smartsheet/Excel export

## Integration Points
- **Supabase**: Authentication, database, real-time updates
- **OpenAI**: GPT models for intelligent processing
- **Smartsheet**: Project management integration
- **File Storage**: Document and asset management`;
  }

  async getApiEndpoints() {
    return {
      "documents": {
        "POST /api/v1/documents/upload": {
          "purpose": "Upload and process construction documents",
          "authentication": "required",
          "body": "multipart/form-data with file",
          "response": "document metadata and processing status"
        },
        "GET /api/v1/documents/{id}": {
          "purpose": "Retrieve document details and processing results",
          "authentication": "required",
          "response": "document data with agent processing results"
        }
      },
      "agents": {
        "POST /api/v1/agents/process": {
          "purpose": "Trigger agent processing workflow",
          "authentication": "required",
          "body": "document_id and processing options",
          "response": "processing job ID and status"
        },
        "GET /api/v1/agents/status/{job_id}": {
          "purpose": "Check agent processing status",
          "authentication": "required",
          "response": "job status and progress information"
        }
      },
      "estimates": {
        "GET /api/v1/estimates/{document_id}": {
          "purpose": "Retrieve cost estimates for processed document",
          "authentication": "required",
          "response": "detailed cost breakdown by trade"
        },
        "POST /api/v1/estimates/export": {
          "purpose": "Export estimates to external formats",
          "authentication": "required",
          "body": "export format and options",
          "response": "export file or external system confirmation"
        }
      }
    };
  }

  async getAgentWorkflows() {
    return `# Agent Workflows and Patterns

## Standard Agent Structure
\`\`\`python
class BaseAgent:
    async def process(self, input_data: Dict) -> Dict:
        try:
            validated_input = self.validate_input(input_data)
            result = await self.execute(validated_input)
            return self.format_output(result)
        except Exception as e:
            return self.handle_error(e)
\`\`\`

## Workflow Patterns

### Sequential Processing
FileReader → Scope → Takeoff → TradeMapper → Estimator → QA → Exporter

### Parallel Processing (where applicable)
- Multiple document sections processed simultaneously
- Independent trade calculations run in parallel
- Quality checks performed concurrently

### Error Handling
- Retry logic for transient failures
- Graceful degradation for partial results
- Comprehensive logging for debugging

## Agent Communication
- Use structured data exchange (TypedDict)
- Include metadata for traceability
- Implement proper error propagation
- Log all inter-agent communications`;
  }

  async getDatabaseSchema() {
    return {
      "tables": {
        "documents": {
          "id": "uuid PRIMARY KEY",
          "filename": "text NOT NULL",
          "content_type": "text",
          "size": "bigint",
          "upload_date": "timestamp DEFAULT now()",
          "processing_status": "text DEFAULT 'pending'",
          "user_id": "uuid REFERENCES users(id)"
        },
        "agent_results": {
          "id": "uuid PRIMARY KEY",
          "document_id": "uuid REFERENCES documents(id)",
          "agent_name": "text NOT NULL",
          "input_data": "jsonb",
          "output_data": "jsonb",
          "processing_time": "interval",
          "status": "text",
          "created_at": "timestamp DEFAULT now()"
        },
        "estimates": {
          "id": "uuid PRIMARY KEY",
          "document_id": "uuid REFERENCES documents(id)",
          "trade_category": "text",
          "quantity": "decimal",
          "unit": "text",
          "unit_cost": "decimal",
          "total_cost": "decimal",
          "confidence_score": "decimal",
          "created_at": "timestamp DEFAULT now()"
        }
      }
    };
  }

  async getUiComponents() {
    return `# UI Components Library

## Available Components

### Layout Components
- **AppLayout**: Main application layout with navigation
- **PageHeader**: Consistent page headers with breadcrumbs
- **Sidebar**: Navigation sidebar with role-based menu items

### Form Components
- **FileUpload**: Drag-and-drop file upload with progress
- **FormField**: Standardized form field with validation
- **SubmitButton**: Form submission button with loading states

### Data Display
- **DataTable**: Sortable, filterable data tables
- **EstimateCard**: Cost estimate display card
- **ProgressBar**: Processing progress indicator
- **StatusBadge**: Status indication with color coding

### Interactive Components
- **Modal**: Overlay dialogs with various sizes
- **Dropdown**: Multi-select and single-select dropdowns
- **Tabs**: Tab navigation for content organization
- **Accordion**: Collapsible content sections

## Component Patterns
- All components use TypeScript interfaces for props
- Include loading and error states
- Follow accessibility best practices
- Use Tailwind CSS for styling consistency`;
  }

  async generateAgent(args) {
    const { name, purpose, inputs = [], outputs = [] } = args;
    
    return `# Generated Agent: ${name}

\`\`\`python
from typing import Dict, List, Optional, Any
from backend.agents.base_agent import BaseAgent
from backend.services.llm_selector import LLMSelector
import logging

logger = logging.getLogger(__name__)

class ${name}(BaseAgent):
    """
    ${purpose}
    
    Inputs: ${inputs.join(', ')}
    Outputs: ${outputs.join(', ')}
    """
    
    def __init__(self):
        super().__init__()
        self.llm_selector = LLMSelector()
        self.agent_name = "${name.toLowerCase()}"
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for ${name}"""
        try:
            logger.info(f"Starting ${name} processing")
            
            # Validate input data
            validated_input = self.validate_input(input_data)
            
            # Select appropriate LLM based on task complexity
            llm_config = await self.llm_selector.select_optimal_llm(
                task_type=self.agent_name,
                input_complexity=self._assess_complexity(validated_input)
            )
            
            # Execute core processing logic
            result = await self._execute_processing(validated_input, llm_config)
            
            # Format and validate output
            formatted_result = self._format_output(result)
            
            logger.info(f"${name} processing completed successfully")
            return formatted_result
            
        except Exception as e:
            logger.error(f"Error in ${name} processing: {str(e)}")
            return self._create_error_response(str(e))
    
    def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input data structure and content"""
        required_fields = ${JSON.stringify(inputs)}
        
        for field in required_fields:
            if field not in input_data:
                raise ValueError(f"Missing required field: {field}")
        
        return input_data
    
    async def _execute_processing(self, input_data: Dict[str, Any], llm_config: Dict) -> Dict[str, Any]:
        """Core processing logic - implement based on agent purpose"""
        # TODO: Implement specific processing logic for ${purpose}
        
        prompt = self._build_prompt(input_data)
        
        response = await self.llm_selector.process_with_llm(
            prompt=prompt,
            config=llm_config,
            max_retries=3
        )
        
        return self._parse_llm_response(response)
    
    def _build_prompt(self, input_data: Dict[str, Any]) -> str:
        """Build LLM prompt based on input data and agent purpose"""
        return f"""
        Task: ${purpose}
        
        Input Data: {input_data}
        
        Please process this data and provide structured output in the following format:
        {{
            ${outputs.map(output => `"${output}": "...",`).join('\n            ')}
            "confidence_score": 0.0-1.0,
            "processing_notes": "..."
        }}
        """
    
    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """Parse and structure LLM response"""
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError:
            # Fallback parsing logic
            return {
                "raw_response": response,
                "confidence_score": 0.5,
                "processing_notes": "Response required manual parsing"
            }
    
    def _format_output(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Format output according to expected structure"""
        return {
            "agent_name": self.agent_name,
            "status": "completed",
            "result": result,
            "metadata": {
                "processing_time": self._get_processing_time(),
                "timestamp": self._get_timestamp()
            }
        }
    
    def _assess_complexity(self, input_data: Dict[str, Any]) -> str:
        """Assess input complexity for LLM selection"""
        # Simple heuristic - can be enhanced based on specific needs
        data_size = len(str(input_data))
        
        if data_size < 1000:
            return "low"
        elif data_size < 5000:
            return "medium"
        else:
            return "high"
\`\`\`

## Usage Example

\`\`\`python
# Initialize and use the agent
agent = ${name}()

input_data = {
    ${inputs.map(input => `"${input}": "sample_value",`).join('\n    ')}
}

result = await agent.process(input_data)
print(f"Agent result: {result}")
\`\`\`
`;
  }

  async generateApiEndpoint(args) {
    const { path, method, purpose, requiresAuth = true } = args;
    
    return `# Generated API Endpoint: ${method} ${path}

\`\`\`python
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging

from backend.services.supabase_client import get_current_user
from backend.agents.manager_agent import ManagerAgent

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer() if ${requiresAuth} else None

class RequestModel(BaseModel):
    """Request model for ${path}"""
    # TODO: Define request fields based on endpoint requirements
    data: Dict[str, Any] = Field(..., description="Request data")
    options: Optional[Dict[str, Any]] = Field(None, description="Processing options")

class ResponseModel(BaseModel):
    """Response model for ${path}"""
    # TODO: Define response fields based on endpoint requirements
    success: bool = Field(..., description="Operation success status")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    message: str = Field(..., description="Response message")

${requiresAuth ? `
async def get_current_user_dependency(token: str = Depends(security)):
    """Dependency to get current authenticated user"""
    try:
        user = await get_current_user(token.credentials)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )
` : ''}

@router.${method.toLowerCase()}("${path}")
async def ${path.split('/').pop().replace('-', '_').replace('{', '').replace('}', '')}_endpoint(
    ${method === 'GET' ? '' : 'request_data: RequestModel,'}
    ${requiresAuth ? 'current_user = Depends(get_current_user_dependency)' : ''}
) -> ResponseModel:
    """
    ${purpose}
    
    - **Purpose**: ${purpose}
    - **Method**: ${method}
    - **Authentication**: ${requiresAuth ? 'Required' : 'Not required'}
    """
    try:
        logger.info(f"Processing ${method} ${path} request")
        
        ${requiresAuth ? '# Verify user permissions if needed\n        # TODO: Add role-based access control if required\n        ' : ''}
        
        ${method === 'GET' ? `
        # Handle GET request logic
        # TODO: Implement data retrieval logic
        result_data = {
            "message": "Data retrieved successfully",
            "timestamp": "2025-06-03T00:00:00Z"
        }
        ` : `
        # Validate request data
        if not request_data.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Request data is required"
            )
        
        # Process request using appropriate agents
        manager = ManagerAgent()
        result = await manager.process_request(
            data=request_data.data,
            options=request_data.options or {},
            user_id=${requiresAuth ? 'current_user.id' : 'None'}
        )
        
        result_data = result
        `}
        
        logger.info(f"${method} ${path} completed successfully")
        
        return ResponseModel(
            success=True,
            data=result_data,
            message="Operation completed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ${method} ${path}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

# Add router to main application
# app.include_router(router, prefix="/api/v1", tags=["${path.split('/')[3] || 'general'}"])
\`\`\`

## OpenAPI Documentation

\`\`\`yaml
${path}:
  ${method.toLowerCase()}:
    summary: ${purpose}
    description: |
      ${purpose}
      
      This endpoint ${method === 'GET' ? 'retrieves' : 'processes'} data and returns structured results.
    ${requiresAuth ? `security:
      - BearerAuth: []` : ''}
    ${method !== 'GET' ? `requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/RequestModel'` : ''}
    responses:
      200:
        description: Successful operation
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ResponseModel'
      ${requiresAuth ? `401:
        description: Unauthorized
      ` : ''}400:
        description: Bad request
      500:
        description: Internal server error
\`\`\`

## Usage Example

\`\`\`javascript
// Frontend API call
const response = await fetch('${path}', {
  method: '${method}',
  ${requiresAuth ? `headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },` : ''}
  ${method !== 'GET' ? `body: JSON.stringify({
    data: {
      // Request data here
    },
    options: {
      // Processing options
    }
  })` : ''}
});

const result = await response.json();
console.log('API Result:', result);
\`\`\`
`;
  }

  async generateReactComponent(args) {
    const { name, type, purpose, props = [] } = args;
    
    const propsInterface = props.length > 0 ? 
      `interface ${name}Props {
  ${props.map(prop => `${prop.name}${prop.required ? '' : '?'}: ${prop.type};`).join('\n  ')}
}` : `interface ${name}Props {
  // TODO: Define component props
}`;

    return `# Generated React Component: ${name}

\`\`\`typescript
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

${propsInterface}

/**
 * ${name} Component
 * 
 * Purpose: ${purpose}
 * Type: ${type}
 */
export const ${name}: React.FC<${name}Props> = ({
  ${props.map(prop => prop.name).join(',\n  ')}
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Effect hooks
  useEffect(() => {
    // TODO: Add initialization logic
  }, []);

  // Event handlers
  const handleAction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement action logic
      
      toast.success('Action completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          ${name.replace(/([A-Z])/g, ' $1').trim()}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          ${purpose}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        ${type === 'form' ? `
        <form onSubmit={(e) => { e.preventDefault(); handleAction(); }}>
          {/* Form fields */}
          <div className="space-y-4">
            {/* TODO: Add form fields based on props */}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
        ` : type === 'modal' ? `
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  {/* Modal content */}
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-base font-semibold leading-6 text-gray-900">
                        Modal Title
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Modal content goes here
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleAction}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        ` : `
        {/* Component content */}
        <div className="space-y-4">
          <p className="text-gray-700">
            Component content will be implemented here based on the specific requirements.
          </p>
          
          <button
            onClick={handleAction}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Action Button
          </button>
        </div>
        `}
      </div>
    </div>
  );
};

export default ${name};
\`\`\`

## Component Usage

\`\`\`typescript
// Import and use the component
import { ${name} } from './components/${name}';

// In your parent component
const ParentComponent = () => {
  return (
    <div>
      <${name}
        ${props.map(prop => `${prop.name}={${prop.type === 'string' ? `"example"` : prop.type === 'boolean' ? 'true' : 'exampleValue'}}`).join('\n        ')}
      />
    </div>
  );
};
\`\`\`

## Styling Notes

This component uses Tailwind CSS classes for styling. Key classes used:
- \`bg-white\`: White background
- \`rounded-lg\`: Large border radius
- \`shadow-sm\`: Small shadow
- \`border border-gray-200\`: Light gray border
- \`px-6 py-4\`: Padding
- \`text-lg font-semibold\`: Typography

## Accessibility Features

- Semantic HTML structure
- Proper ARIA labels (add as needed)
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly
`;
  }

  async analyzeProject(args) {
    const { focus } = args;
    
    const analyses = {
      performance: `# Performance Analysis

## Current Performance State
- **Backend**: FastAPI with async/await patterns ✅
- **Frontend**: React with modern hooks ✅
- **Database**: Supabase/PostgreSQL with indexing ⚠️
- **AI Processing**: Multiple LLM calls need optimization ⚠️

## Recommendations

### 1. Database Optimization
- Add indexes on frequently queried columns
- Implement database connection pooling
- Use prepared statements for repeated queries
- Consider read replicas for heavy read workloads

### 2. Caching Strategy
\`\`\`python
# Implement Redis caching for API responses
from redis import Redis
import json

cache = Redis(host='localhost', port=6379, db=0)

async def get_cached_result(key: str):
    result = cache.get(key)
    return json.loads(result) if result else None

async def set_cached_result(key: str, data: dict, ttl: int = 3600):
    cache.setex(key, ttl, json.dumps(data))
\`\`\`

### 3. Frontend Optimization
- Implement lazy loading for components
- Use React.memo for expensive renders
- Optimize bundle size with code splitting
- Add service worker for caching

### 4. Agent Processing
- Implement agent result caching
- Use parallel processing where possible
- Add circuit breakers for external API calls
- Optimize LLM prompt engineering`,

      security: `# Security Analysis

## Current Security State
- **Authentication**: Supabase Auth implemented ✅
- **Authorization**: Role-based access needed ⚠️
- **API Security**: Basic validation in place ⚠️
- **Data Protection**: Encryption at rest/transit needed ⚠️

## Recommendations

### 1. API Security Hardening
\`\`\`python
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def verify_token(token: str = Security(security)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
\`\`\`

### 2. Input Validation
- Implement comprehensive input sanitization
- Use Pydantic models for all API inputs
- Add rate limiting to prevent abuse
- Validate file uploads with content inspection

### 3. Data Protection
- Implement field-level encryption for sensitive data
- Add audit logging for all data access
- Use environment variables for all secrets
- Implement proper session management

### 4. Infrastructure Security
- Enable HTTPS everywhere
- Implement CORS policies
- Add security headers
- Regular security dependency updates`,

      architecture: `# Architecture Analysis

## Current Architecture State
- **Modularity**: Good separation of concerns ✅
- **Scalability**: Monolithic structure needs improvement ⚠️
- **Maintainability**: Clear code organization ✅
- **Testability**: Test coverage needs improvement ⚠️

## Recommendations

### 1. Microservices Migration
Consider splitting into focused services:
- **Document Service**: File upload and processing
- **Agent Service**: AI processing workflows
- **Estimation Service**: Cost calculations
- **Export Service**: Data formatting and export

### 2. Event-Driven Architecture
\`\`\`python
# Implement event bus for agent communication
from typing import Dict, Any
import asyncio
from dataclasses import dataclass

@dataclass
class Event:
    type: str
    data: Dict[str, Any]
    timestamp: float

class EventBus:
    def __init__(self):
        self.subscribers = {}
    
    def subscribe(self, event_type: str, handler):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)
    
    async def publish(self, event: Event):
        if event.type in self.subscribers:
            tasks = [handler(event) for handler in self.subscribers[event.type]]
            await asyncio.gather(*tasks)
\`\`\`

### 3. API Versioning Strategy
- Implement proper API versioning
- Use semantic versioning for releases
- Maintain backward compatibility
- Document breaking changes

### 4. Monitoring and Observability
- Add comprehensive logging
- Implement health checks
- Use distributed tracing
- Monitor key performance metrics`,

      testing: `# Testing Analysis

## Current Testing State
- **Unit Tests**: Basic coverage ⚠️
- **Integration Tests**: Limited coverage ⚠️
- **E2E Tests**: Not implemented ❌
- **API Tests**: Partial coverage ⚠️

## Recommendations

### 1. Unit Testing Strategy
\`\`\`python
import pytest
from unittest.mock import AsyncMock, patch
from backend.agents.scope_agent import ScopeAgent

@pytest.mark.asyncio
async def test_scope_agent_processing():
    agent = ScopeAgent()
    
    # Mock external dependencies
    with patch.object(agent.llm_selector, 'process_with_llm') as mock_llm:
        mock_llm.return_value = {"scope": "Commercial Building", "confidence": 0.9}
        
        result = await agent.process({
            "document_text": "Sample construction document",
            "project_type": "commercial"
        })
        
        assert result["status"] == "completed"
        assert "scope" in result["result"]
\`\`\`

### 2. Integration Testing
- Test agent workflows end-to-end
- Validate database interactions
- Test external API integrations
- Mock external services appropriately

### 3. Frontend Testing
\`\`\`typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentUpload } from '../components/DocumentUpload';

test('should upload document successfully', async () => {
  render(<DocumentUpload />);
  
  const fileInput = screen.getByLabelText(/upload document/i);
  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  
  fireEvent.change(fileInput, { target: { files: [file] } });
  
  expect(screen.getByText('test.pdf')).toBeInTheDocument();
});
\`\`\`

### 4. Test Automation
- Set up CI/CD pipeline with automated testing
- Implement test coverage reporting
- Add performance testing
- Regular security testing`,

      "ui-ux": `# UI/UX Analysis

## Current UI/UX State
- **Design System**: Tailwind CSS implementation ✅
- **Accessibility**: Basic compliance ⚠️
- **User Flow**: Needs optimization ⚠️
- **Mobile Experience**: Not optimized ❌

## Recommendations

### 1. Design System Enhancement
\`\`\`typescript
// Create consistent design tokens
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
  typography: {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-semibold',
    body: 'text-base',
    caption: 'text-sm text-gray-600',
  },
};
\`\`\`

### 2. Accessibility Improvements
- Add proper ARIA labels
- Implement keyboard navigation
- Ensure color contrast compliance
- Add screen reader support

### 3. User Experience Enhancements
- Implement progressive disclosure
- Add contextual help and tooltips
- Improve error messaging
- Add loading states and progress indicators

### 4. Mobile Optimization
\`\`\`typescript
// Responsive design patterns
const ResponsiveComponent = () => {
  return (
    <div className="
      grid 
      grid-cols-1 
      md:grid-cols-2 
      lg:grid-cols-3 
      gap-4 
      p-4 
      md:p-6
    ">
      {/* Mobile-first responsive content */}
    </div>
  );
};
\`\`\`

### 5. Performance UX
- Implement skeleton loading screens
- Add optimistic UI updates
- Use virtual scrolling for large lists
- Implement proper caching strategies`
    };

    return analyses[focus] || `# Analysis not available for focus area: ${focus}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PIP AI MCP Server running on stdio');
  }
}

// Start the server
if (require.main === module) {
  const server = new PipAiMcpServer();
  server.run().catch(console.error);
}

module.exports = { PipAiMcpServer };
