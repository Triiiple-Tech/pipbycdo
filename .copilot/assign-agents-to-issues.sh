#!/bin/bash

# PIP AI - Assign Copilot Agents to All Issues
# This script ensures all GitHub issues have Copilot agents assigned
# and are configured to use the ultimate Copilot environment

set -e

# Configuration
PROJECT_NAME="PIP AI"
COPILOT_USER="Copilot"
OWNER_USER="drewthekiiid"
REPO_NAME="pipbycdo"
COPILOT_INSTRUCTIONS_FILE=".copilot-instructions.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if gh CLI is installed and authenticated
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed. Please install it first."
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Get all open issues
get_all_issues() {
    log "Fetching all open issues..."
    gh issue list --limit 100 --json number,title,assignees,state --jq '.[] | select(.state == "OPEN")'
}

# Check if Copilot is assigned to an issue
is_copilot_assigned() {
    local issue_number=$1
    local assignees=$(gh issue view $issue_number --json assignees --jq '.assignees[].login')
    
    if echo "$assignees" | grep -q "^Copilot$"; then
        return 0  # Copilot is assigned
    else
        return 1  # Copilot is not assigned
    fi
}

# Assign Copilot to an issue
assign_copilot_to_issue() {
    local issue_number=$1
    local issue_title=$2
    
    log "Assigning Copilot to issue #$issue_number: $issue_title"
    
    # Try to assign Copilot (this might fail if Copilot is already assigned)
    if gh issue edit $issue_number --add-assignee "$COPILOT_USER" 2>/dev/null; then
        success "Assigned Copilot to issue #$issue_number"
    else
        warning "Could not assign Copilot to issue #$issue_number (may already be assigned)"
    fi
    
    # Also assign the owner for collaboration
    if gh issue edit $issue_number --add-assignee "$OWNER_USER" 2>/dev/null; then
        log "Also assigned $OWNER_USER to issue #$issue_number for collaboration"
    fi
}

# Add Copilot-specific comment with instructions
add_copilot_instructions_comment() {
    local issue_number=$1
    
    # Check if we already added instructions
    local existing_comment=$(gh issue view $issue_number --json comments --jq '.comments[] | select(.body | contains("@Copilot Ultimate Environment")) | .body')
    
    if [ -n "$existing_comment" ]; then
        log "Copilot instructions already present for issue #$issue_number"
        return
    fi
    
    log "Adding Copilot environment instructions to issue #$issue_number"
    
    local comment_body="@Copilot Ultimate Environment Active 🚀

This issue is configured to use the PIP AI Ultimate GitHub Copilot Environment:

## Available Context:
- **Project Instructions**: See \`.copilot-instructions.md\` for comprehensive guidelines
- **Agent Patterns**: Use established agent-based architecture patterns
- **Code Snippets**: Leverage VS Code snippets for consistent code style
- **MCP Server**: Enhanced context via Model Context Protocol server

## Key Guidelines:
- Follow FastAPI + React/TypeScript architecture
- Implement agent-based document processing patterns
- Use Supabase for data persistence
- Focus on construction industry context
- Maintain security best practices (no hardcoded credentials)

## File Structure:
\`\`\`
backend/agents/     # AI agent implementations
backend/app/        # FastAPI application
backend/services/   # Business logic
ui/src/components/  # React components
ui/src/pages/       # Page components
\`\`\`

Ready to assist with this issue! 🤖✨"

    if gh issue comment $issue_number --body "$comment_body"; then
        success "Added Copilot instructions to issue #$issue_number"
    else
        error "Failed to add instructions to issue #$issue_number"
    fi
}

# Update issue labels for better Copilot understanding
update_issue_labels() {
    local issue_number=$1
    local issue_title=$2
    
    # Determine appropriate labels based on issue title
    local labels=""
    
    if echo "$issue_title" | grep -qi "ux\|ui\|interface\|design"; then
        labels="$labels,enhancement,ui/ux"
    fi
    
    if echo "$issue_title" | grep -qi "performance\|optimization"; then
        labels="$labels,performance,optimization"
    fi
    
    if echo "$issue_title" | grep -qi "documentation\|help"; then
        labels="$labels,documentation"
    fi
    
    if echo "$issue_title" | grep -qi "responsive\|mobile"; then
        labels="$labels,responsive-design"
    fi
    
    if echo "$issue_title" | grep -qi "accessibility"; then
        labels="$labels,accessibility,a11y"
    fi
    
    if echo "$issue_title" | grep -qi "search\|filter"; then
        labels="$labels,feature,search"
    fi
    
    # Add Copilot-specific label
    labels="copilot-enhanced$labels"
    
    if [ -n "$labels" ]; then
        log "Adding labels to issue #$issue_number: $labels"
        if gh issue edit $issue_number --add-label "$labels" 2>/dev/null; then
            success "Updated labels for issue #$issue_number"
        else
            warning "Could not update labels for issue #$issue_number"
        fi
    fi
}

# Main function to process all issues
assign_agents_to_all_issues() {
    log "Starting Copilot agent assignment for all issues..."
    
    local issues_json=$(get_all_issues)
    local issue_count=$(echo "$issues_json" | jq -s 'length')
    
    if [ "$issue_count" -eq 0 ]; then
        warning "No open issues found"
        return
    fi
    
    log "Found $issue_count open issues to process"
    
    echo "$issues_json" | jq -s '.[]' | while read -r issue; do
        local issue_number=$(echo "$issue" | jq -r '.number')
        local issue_title=$(echo "$issue" | jq -r '.title')
        
        log "Processing issue #$issue_number: $issue_title"
        
        # Assign Copilot if not already assigned
        if ! is_copilot_assigned $issue_number; then
            assign_copilot_to_issue $issue_number "$issue_title"
        else
            success "Copilot already assigned to issue #$issue_number"
        fi
        
        # Add Copilot instructions comment
        add_copilot_instructions_comment $issue_number
        
        # Update labels for better categorization
        update_issue_labels $issue_number "$issue_title"
        
        log "Completed processing issue #$issue_number"
        echo "---"
    done
    
    success "Completed Copilot agent assignment for all issues!"
}

# Generate report
generate_assignment_report() {
    log "Generating assignment report..."
    
    local report_file="copilot-agent-assignment-report.md"
    
    cat > "$report_file" << EOF
# Copilot Agent Assignment Report

Generated on: $(date)

## Summary

This report shows the status of GitHub Copilot agent assignments across all issues in the PIP AI repository.

## Issues with Copilot Agents

EOF
    
    gh issue list --limit 100 --json number,title,assignees,labels,state | jq -r '.[] | select(.state == "OPEN") | "- Issue #\(.number): \(.title)\n  - Assignees: \(.assignees | map(.login) | join(", "))\n  - Labels: \(.labels | map(.name) | join(", "))\n"' >> "$report_file"
    
    cat >> "$report_file" << EOF

## Ultimate Copilot Environment Features Active

- ✅ Project-specific instructions (`.copilot-instructions.md`)
- ✅ Enhanced VS Code settings and snippets
- ✅ Model Context Protocol server for rich context
- ✅ Development automation scripts
- ✅ Security-enhanced configuration

## Next Steps

1. Monitor Copilot agent progress on assigned issues
2. Review generated pull requests from agents
3. Provide feedback to improve agent performance
4. Update project instructions as needed

---

Report generated by PIP AI Ultimate Copilot Environment
EOF
    
    success "Assignment report generated: $report_file"
}

# Main execution
main() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                PIP AI Copilot Agent Assignment              ║"
    echo "║            Ultimate GitHub Copilot Environment              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    assign_agents_to_all_issues
    generate_assignment_report
    
    echo ""
    success "All GitHub issues have been configured with Copilot agents!"
    success "The ultimate Copilot environment is now active for all issues."
    
    echo ""
    log "To monitor progress:"
    echo "  - View issues: gh issue list"
    echo "  - Check agent activity: gh issue view <issue_number>"
    echo "  - Monitor PRs: gh pr list"
}

# Run main function
main "$@"
