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

# VS Code & GitHub Copilot Cloud Environment Instructions

This repository is pre-configured for **VS Code Cloud Environments** (**GitHub Copilot Coding Agent** via `.github/workflows/copilot-setup-steps.yml` and **GitHub Codespaces / Dev Containers** via `.devcontainer/devcontainer.json`) with full outbound AWS SSM (`SendCommand` + `StartSession`) and SSH/SCP/rsync-over-SSM access to the AWS EC2 fleet.

- **Default box for this repo:** `famp-research` (`i-07b4eecaa41cb53a8` in `us-east-1`, remote dir `/opt/madoffs-fantasy`)

## AWS SSM & SSH Commands

```bash
bash ops/cloud-agent/box.sh status                          # Verify AWS STS identity + default box (famp-research)
bash ops/cloud-agent/box.sh fleet                           # Check EC2 & SSM status of all 9 fleet boxes
bash ops/cloud-agent/box.sh exec -- '<cmd>'                 # Run command via SSM on default box (famp-research)
bash ops/cloud-agent/box.sh --box <alias> exec -- '<cmd>'   # Run command via SSM on any fleet box
ssh famp-research                                                   # SSH over SSM tunnel (works with scp/rsync too)
bash ops/cloud-agent/box.sh --box <alias> start             # Boot a stopped on-demand box and wait for SSM Online
```

## Fleet Host Aliases (`~/.ssh/config` & `box.sh --box`)

| Alias | Instance ID | Region | Role / Path |
|-------|-------------|--------|-------------|
| `polygamy` | `i-01c97deadad199159` | `us-east-1` | Poly-gamy live/shadow node (`/opt/polygamy`) |
| `famp-sniper` | `i-002255402e5ed0044` | `eu-west-1` | Poly-gamy / FAMP Dublin sniper (`54.220.211.64`) |
| `bpumper` | `i-001af733ab7600594` | `eu-central-1` | BPumper Frankfurt node (`/opt/bpumper`, `/var/lib/bpumper`) |
| `famp-research` | `i-07b4eecaa41cb53a8` | `us-east-1` | FAMP & Cryptologist research (`r7i.8xlarge`, `/opt/madoffs-fantasy`) |
| `famp-hl-live` | `i-0de47d4dca7713d99` | `ap-northeast-1` | Hyperliquid live Tokyo node (`/opt/madoffs-fantasy`) |
| `famp-hl-pilot` | `i-041be9b38ad6e05e7` | `ap-northeast-1` | Hyperliquid pilot & mainnet shadows (`famp-testmp`) |
| `famp-drift` | `i-0cefa97eec12f66bf` | `eu-central-1` | Drift Frankfurt harness (on-demand) |
| `famp-alpaca` | `i-007a1960d1581eef0` | `us-east-1` | Alpaca Virginia harness (on-demand) |
| `paperroute-box` | `i-08074a84c7478855e` | `us-east-1` | PaperRoute devbox (`/home/ubuntu/paperroute`, on-demand) |
