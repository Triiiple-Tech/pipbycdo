# PIP AI Issue Monitoring Guide

## Quick Commands:
```bash
# Basic status check
./simple_monitor.sh

# Detailed issue view (when network works)
./monitor_issues.sh

# Check specific issue
gh issue view 14

# Watch for changes (auto-refresh every 5 minutes)
watch -n 300 ./simple_monitor.sh
```

## VS Code Tasks (Press Cmd+Shift+P → "Tasks: Run Task"):
- **Monitor GitHub Issues** - One-time check
- **Watch Issues (Auto-refresh)** - Continuous monitoring
- **Quick Issue Status** - Fast summary

## What to Watch For:
1. **Status Changes**: Open → In Progress → Closed
2. **New Comments**: Agents updating progress
3. **Pull Requests**: Code implementations
4. **Label Updates**: Priority or status changes
5. **Assignee Changes**: When agents pick up tasks

## Notification Triggers:
- Issue state changes
- New comments on assigned issues
- Pull requests referencing issues
- Completion notifications

## Troubleshooting:
- If GitHub API timeouts occur, use ./simple_monitor.sh
- Check VS Code GitHub panel for real-time updates
- Use `gh auth refresh` if authentication issues occur
