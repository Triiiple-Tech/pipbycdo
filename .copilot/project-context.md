# GitHub Copilot Workspace Configuration
# This file enhances Copilot's understanding of the PIP AI project

## Project Overview
This is the PIP AI construction document analysis platform with the following key components:

### Architecture
- **Backend**: FastAPI with agent-based microservices architecture
- **Frontend**: React + TypeScript with Vite build tool
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI GPT-4o, GPT-4o-mini, and o3-mini models
- **Integration**: Smartsheet API for estimate exports

### Agent System
The core of PIP AI is a sophisticated agent orchestration system:

1. **Manager Agent** (`backend/agents/manager_agent.py`)
   - Entry point for all requests
   - Routes to specialized agents
   - Orchestrates multi-step workflows

2. **File Reader Agent** (`backend/agents/file_reader_agent.py`)
   - Processes PDF, DOCX, XLSX files
   - Extracts structured content
   - Handles large document chunking

3. **Classifier Agent** (Future implementation)
   - Categorizes construction documents
   - Extracts metadata and document types

4. **Trade Mapper Agent** (`backend/agents/trade_mapper_agent.py`)
   - Maps activities to construction trades
   - Identifies labor requirements

5. **Scope Agent** (`backend/agents/scope_agent.py`)
   - Generates project scopes
   - Creates work breakdown structures

6. **Estimator Agent** (`backend/agents/estimator_agent.py`)
   - Calculates construction costs
   - Generates detailed estimates

7. **QA Validator Agent** (`backend/agents/qa_validator_agent.py`)
   - Reviews outputs for accuracy
   - Ensures construction industry compliance

8. **Exporter Agent** (`backend/agents/exporter_agent.py`)
   - Formats data for Smartsheet
   - Handles external system integration

### Development Patterns

#### Agent Development Pattern
```python
class NewAgent(BaseAgent):
    def __init__(self, gpt_handler: GPTHandler):
        super().__init__(gpt_handler)
        self.agent_type = "new_agent"
        
    async def process(self, context: AgentContext) -> AgentResponse:
        # Always include comprehensive error handling
        # Use structured logging
        # Return proper AgentResponse objects
```

#### React Component Pattern
```typescript
interface ComponentProps {
    // Always use TypeScript interfaces
    // Include proper prop validation
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
    // Use React hooks properly
    // Include loading and error states
    // Integrate with chat context when needed
};
```

#### API Endpoint Pattern
```python
@router.post("/endpoint")
async def endpoint_handler(
    request: RequestModel,
    current_user = Depends(get_current_user)
):
    # Always include proper validation
    # Use Pydantic models
    # Handle errors gracefully
    # Return structured responses
```

### File Organization
- `backend/agents/` - All agent implementations
- `backend/services/` - Shared services (GPT, Supabase, etc.)
- `backend/routes/` - API endpoint definitions
- `ui/src/components/` - React components
- `ui/src/hooks/` - Custom React hooks
- `ui/src/types/` - TypeScript type definitions

### Key Dependencies
- FastAPI, Pydantic, SQLAlchemy (Backend)
- React, TypeScript, TailwindCSS, shadcn/ui (Frontend)
- OpenAI Python SDK, Supabase client
- Vite for build tooling

### Environment Variables
- `OPENAI_4o_KEY` - OpenAI API key for GPT-4o
- `OPENAI_o3_KEY` - OpenAI API key for o3-mini
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SMARTSHEET_API_KEY` - Smartsheet integration key

### Coding Standards
- Always use TypeScript for frontend code
- Use async/await for all asynchronous operations
- Include comprehensive error handling
- Use structured logging with proper log levels
- Follow RESTful API design principles
- Use Pydantic for data validation
- Include proper type hints in Python code
- Use React hooks and functional components
- Implement proper loading states and error boundaries

### Testing Strategy
- Unit tests for all agent methods
- Integration tests for API endpoints
- E2E tests for critical user workflows
- Performance tests for file processing

### Current Focus Areas
1. Implementing missing classifier agent
2. Enhancing UI/UX based on user feedback
3. Optimizing file processing performance
4. Expanding Smartsheet integration features
5. Adding real-time collaboration features

When generating code, always consider:
- Construction industry context and terminology
- Multi-agent workflow orchestration
- File processing and document analysis
- Cost estimation and project management
- Integration with external systems
- Real-time chat interface patterns
