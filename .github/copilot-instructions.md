# GitHub Copilot Workspace Agent Instructions

This repository contains an enhanced GitHub Copilot development environment specifically optimized for autonomous coding agents.

## Agent Context

When working on issues in this repository, GitHub Copilot agents should be aware of:

### Project Architecture
- **Backend**: FastAPI with agent-based processing architecture
- **Frontend**: React/TypeScript with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT models with intelligent routing
- **Industry Focus**: Construction document analysis and cost estimation

### Key Components
1. **AI Agents**: 8 specialized agents for document processing workflow
2. **API Routes**: RESTful endpoints with Pydantic validation
3. **React Components**: Functional components with hooks and TypeScript
4. **Database Schema**: Construction-focused data models

### Development Environment
- **Enhanced Copilot Config**: Located in `.vscode/settings.json`
- **Project Instructions**: Detailed guidelines in `.copilot-instructions.md`
- **Code Snippets**: Project-specific patterns in `.vscode/snippets.code-snippets`
- **MCP Server**: Model Context Protocol server in `.copilot/` directory

### Autonomous Agent Guidelines

When assigned to issues, please:

1. **Review Project Context**: Always check `.copilot-instructions.md` for project-specific patterns
2. **Use Existing Patterns**: Follow the established agent architecture and code patterns
3. **Maintain Consistency**: Use the code snippets and established naming conventions
4. **Consider Industry Context**: Remember this is for construction document processing
5. **Test Integration**: Ensure changes work with the existing agent workflow

### Code Generation Preferences
- Use async/await for all agent operations
- Follow the BaseAgent pattern for new agents
- Include comprehensive error handling and logging
- Use TypedDict for structured data exchange
- Implement proper input validation with Pydantic models

### Available Resources
- Development automation scripts in `.copilot/development-automation.sh`
- MCP server for enhanced context at port 3001
- Project-specific VS Code tasks for common operations
- Comprehensive test suites in `backend/tests/` and automated workflows

### Security Requirements
- Never hardcode API keys or secrets
- Use environment variables for all sensitive configuration
- Follow the security patterns established in existing code
- Ensure proper authentication for all API endpoints

This environment is optimized to provide maximum context and guidance for autonomous coding agents working on the PIP AI construction document analysis platform.
