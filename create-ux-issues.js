#!/usr/bin/env node

const https = require('https');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';
const OWNER = 'Triiiple-Tech';
const REPO = 'pipbycdo';
const ASSIGNEE = 'drewthekiiid';

// Check if token is provided
if (GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
  console.error('Please set your GitHub token in the GITHUB_TOKEN environment variable or update the script.');
  console.error('You can create a token at: https://github.com/settings/tokens');
  process.exit(1);
}

// Issues to create
const issues = [
  {
    title: "Chat Interface Enhancements - UX Master Doc Implementation",
    body: `## Overview
Implement chat interface enhancements as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Add message timestamps with relative time display
- [ ] Implement typing indicators for AI responses
- [ ] Add message editing capabilities
- [ ] Enable message reactions/feedback system
- [ ] Create threaded conversation support
- [ ] Add voice input/output capabilities
- [ ] Implement rich text formatting in messages
- [ ] Add file attachment support with preview
- [ ] Create quick action buttons for common tasks
- [ ] Implement smart suggestions/autocomplete

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- All chat interface features work smoothly
- Features are responsive across devices
- Proper error handling is implemented
- User feedback is clear and intuitive`,
    labels: ["enhancement", "ux", "frontend"]
  },
  {
    title: "History & Context Management - UX Master Doc Implementation",
    body: `## Overview
Implement history and context management features as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Create searchable conversation history
- [ ] Add conversation export/import functionality
- [ ] Implement conversation bookmarking
- [ ] Add conversation tagging system
- [ ] Create conversation templates
- [ ] Enable conversation sharing with permissions
- [ ] Add conversation analytics/insights
- [ ] Implement conversation archiving
- [ ] Create conversation restore from trash
- [ ] Add conversation version control

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- History features are fast and responsive
- Search functionality works accurately
- Data persistence is reliable
- User can easily manage their conversation history`,
    labels: ["enhancement", "ux", "frontend", "backend"]
  },
  {
    title: "Navigation & UI Improvements - UX Master Doc Implementation",
    body: `## Overview
Implement navigation and UI improvements as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Add breadcrumb navigation
- [ ] Implement keyboard shortcuts overlay
- [ ] Create customizable sidebar
- [ ] Add floating action button for quick access
- [ ] Implement gesture controls for mobile
- [ ] Add navigation history (back/forward)
- [ ] Create quick jump menu
- [ ] Implement tab management for multiple chats
- [ ] Add workspace/project switching
- [ ] Create command palette (Cmd+K style)

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- Navigation is intuitive and fast
- All shortcuts work consistently
- Mobile gestures feel natural
- UI elements are properly positioned`,
    labels: ["enhancement", "ux", "frontend"]
  },
  {
    title: "Visual Feedback & Indicators - UX Master Doc Implementation",
    body: `## Overview
Implement visual feedback and indicator features as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Add loading states with progress indicators
- [ ] Implement skeleton screens during content load
- [ ] Create success/error animations
- [ ] Add hover effects and micro-interactions
- [ ] Implement smooth transitions between states
- [ ] Add visual hierarchy improvements
- [ ] Create focus indicators for accessibility
- [ ] Implement color-coded status indicators
- [ ] Add tooltips for all interactive elements
- [ ] Create visual cues for user guidance

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- All feedback is clear and immediate
- Animations are smooth and performant
- Visual indicators are consistent
- No jarring transitions`,
    labels: ["enhancement", "ux", "frontend", "design"]
  },
  {
    title: "Accessibility Features - UX Master Doc Implementation",
    body: `## Overview
Implement accessibility features as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Implement full keyboard navigation
- [ ] Add screen reader support with ARIA labels
- [ ] Create high contrast mode
- [ ] Add font size adjustment controls
- [ ] Implement reduced motion mode
- [ ] Add color blind friendly themes
- [ ] Create focus trap for modals
- [ ] Implement skip navigation links
- [ ] Add alt text for all images
- [ ] Create accessible form controls

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- WCAG 2.1 AA compliance
- All features keyboard accessible
- Screen reader compatible
- No accessibility errors in automated testing`,
    labels: ["enhancement", "ux", "accessibility", "frontend"]
  },
  {
    title: "Settings & Preferences - UX Master Doc Implementation",
    body: `## Overview
Implement settings and preferences features as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Create comprehensive settings panel
- [ ] Add theme customization (light/dark/custom)
- [ ] Implement notification preferences
- [ ] Add privacy settings controls
- [ ] Create API key management interface
- [ ] Implement language preferences
- [ ] Add export/import settings functionality
- [ ] Create profile customization options
- [ ] Implement workspace settings
- [ ] Add advanced developer options

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- Settings persist across sessions
- Changes apply immediately
- Settings sync across devices
- Clear organization of options`,
    labels: ["enhancement", "ux", "frontend", "backend"]
  },
  {
    title: "Search & Filter Capabilities - UX Master Doc Implementation",
    body: `## Overview
Implement search and filter capabilities as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Add global search functionality
- [ ] Implement advanced search filters
- [ ] Create search history/suggestions
- [ ] Add search result highlighting
- [ ] Implement fuzzy search
- [ ] Create saved search queries
- [ ] Add search shortcuts
- [ ] Implement real-time search
- [ ] Create search analytics
- [ ] Add search export functionality

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- Search returns relevant results quickly
- Filters work correctly
- Search UI is intuitive
- Performance remains good with large datasets`,
    labels: ["enhancement", "ux", "frontend", "backend"]
  },
  {
    title: "Responsive Design Implementation - UX Master Doc",
    body: `## Overview
Implement responsive design improvements as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Optimize mobile chat interface
- [ ] Create tablet-specific layouts
- [ ] Implement responsive grid system
- [ ] Add touch-optimized controls
- [ ] Create adaptive typography
- [ ] Implement responsive images/media
- [ ] Add viewport-specific features
- [ ] Create responsive navigation patterns
- [ ] Implement responsive forms
- [ ] Add device-specific optimizations

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- Works flawlessly on all device sizes
- No horizontal scrolling on mobile
- Touch targets meet minimum size requirements
- Performance is optimized for mobile`,
    labels: ["enhancement", "ux", "frontend", "responsive"]
  },
  {
    title: "Performance Optimizations - UX Master Doc Implementation",
    body: `## Overview
Implement performance optimizations as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Implement lazy loading for conversations
- [ ] Add virtual scrolling for long lists
- [ ] Optimize bundle size and code splitting
- [ ] Implement caching strategies
- [ ] Add request debouncing/throttling
- [ ] Optimize image loading and formats
- [ ] Implement progressive web app features
- [ ] Add offline functionality
- [ ] Create performance monitoring
- [ ] Optimize render performance

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- Page load time under 3 seconds
- Smooth scrolling and interactions
- No memory leaks
- Lighthouse score above 90`,
    labels: ["enhancement", "performance", "frontend", "backend"]
  },
  {
    title: "Documentation & Help System - UX Master Doc Implementation",
    body: `## Overview
Implement documentation and help system features as outlined in the UX Enhancement Master Doc.

## Tasks
- [ ] Create interactive onboarding tour
- [ ] Add contextual help tooltips
- [ ] Implement in-app documentation
- [ ] Create video tutorials integration
- [ ] Add FAQ section
- [ ] Implement help search
- [ ] Create user guides
- [ ] Add keyboard shortcuts guide
- [ ] Implement feedback/support system
- [ ] Create API documentation viewer

## Reference
See: \`/pipbycdo/ui/src/design_references/🧠 PIP AI – UX ENHANCEMENT MASTER DOC 20394b73a484809e9806ea83e0c5b058.md\`

## Acceptance Criteria
- Help is easily accessible
- Documentation is comprehensive
- Search works effectively
- Content is up-to-date`,
    labels: ["enhancement", "documentation", "ux", "frontend"]
  }
];

// Function to create an issue
function createIssue(issue) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
      assignees: [ASSIGNEE]
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${OWNER}/${REPO}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Node.js Script',
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201) {
          const created = JSON.parse(responseData);
          console.log(`✅ Created issue #${created.number}: ${created.title}`);
          resolve(created);
        } else {
          console.error(`❌ Failed to create issue "${issue.title}"`);
          console.error(`Status: ${res.statusCode}`);
          console.error(`Response: ${responseData}`);
          reject(new Error(`Failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error creating issue "${issue.title}": ${e.message}`);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Function to create all issues with delay
async function createAllIssues() {
  console.log(`🚀 Starting to create ${issues.length} issues...`);
  console.log(`Repository: ${OWNER}/${REPO}`);
  console.log(`Assignee: ${ASSIGNEE}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < issues.length; i++) {
    try {
      await createIssue(issues[i]);
      successCount++;
      
      // Add a small delay to avoid rate limiting
      if (i < issues.length - 1) {
        console.log('⏳ Waiting 2 seconds before next issue...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully created: ${successCount} issues`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} issues`);
  }
  console.log(`\n🔗 View issues at: https://github.com/${OWNER}/${REPO}/issues`);
}

// Run the script
createAllIssues().catch(console.error);
