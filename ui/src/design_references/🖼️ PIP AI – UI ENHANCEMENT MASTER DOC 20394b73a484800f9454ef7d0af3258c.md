# 🖼️ PIP AI – UI ENHANCEMENT MASTER DOC

## I. Brand & Visual Identity

### 🎨 CDO Red

- Set custom Tailwind color: `cdo-red: #E60023`
- Must be used for:
    - Buttons
    - Accent borders
    - Focus rings
    - Status indicators
    - Agent highlights
- 🔒 Prohibited:
    - Any gradients
    - Off-brand reds
    - Legacy “web safe” reds

---

### ✍️ Typography

- Font: **Inter**, applied via `font-sans` globally
- Sizing hierarchy:
    - `text-2xl font-bold` → Section Headers
    - `text-base` → Body text
    - `text-sm`, `text-xs` → Metadata, Labels

---

### 📐 Spacing & Layout

- Card/Section Padding:
    - **Minimum:** `p-6`
- Section Gap:
    - **Minimum:** `gap-8` between major components
- Container Backgrounds:
    - Use **`bg-white`** or **`bg-gray-50`**
    - Glass backgrounds only allowed for sidebar (`bg-white/30 + backdrop-blur`)
- Overflow behavior:
    - Use `overflow-auto` on modals, sections if necessary

---

## II. Components & Visual Hierarchy

### 📦 Cards & Shadows

- All floating elements:
    - `shadow-lg`, `rounded-lg`, `p-6`
- Sidebar design:
    - Glassmorphic with: `bg-white/30`, `backdrop-blur-md`, `shadow-lg`

---

### 🖼 Iconography

- Standard Library: **Lucide**, fallback: **Heroicons**
- Size: `w-7 h-7` universal standard
- Color:
    - Consistent with agent type/status
    - Grayscale for inactive/disabled icons

---

## III. Agent & Status Identity

### 🧠 Agent Color Map

| Agent Type | Color | Status Behavior |
| --- | --- | --- |
| Manager / QA | Neutral Gray | Idle default |
| File Reader | Deep Blue | Pulse when parsing |
| Classifier / Scope | Teal | Glow when active |
| Takeoff / Extract | Teal | Animate when computing |
| Exporter | Green | Fade-in success, green check |
| All Active Agents | CDO Red | Animated ring glow / bounce-in state |
- Agent badges display:
    - Name
    - Role
    - Model
    - Cost badge (optional for admin)

---

## IV. UI Structure & Elements

### 📚 Sidebar & Navigation

- Fixed left, vertical stack
- Glassmorphic background
- Icons: `Chat`, `File Upload`, `Smartsheet`, `Clear`, `New`
- Logo at top, favicon enforced

---

### 💬 Chat UI Standards

- Message Bubbles:
    - User → right-aligned, neutral background
    - Agent → left-aligned, tinted by agent role
- Chat Metadata (optional toggle):
    - Timestamps
    - Token count
    - Model name
    - Estimated cost
- Input Bar:
    - Fixed at bottom
    - Drag-and-drop enabled
    - Shows status + typing indicator + token count
- Upload Overlay:
    - CDO-red border
    - Drop zone animation
    - File icon, type, and name preview

---

## V. Responsiveness & Accessibility

### 📱 Layout Rules

- Mobile: chat interface centered, clean margin
- Desktop: fill width, sidebar anchored
- Viewport-aware breakpoints for modals, popups

### ♿ A11y Standards

- Keyboard navigation throughout
- Focus rings: CDO Red visible on all inputs
- ARIA labels for:
    - Buttons
    - Sidebar shortcuts
    - File dropzones
    - Toggle controls

---

## VI. Animation & Motion

### ⚡ Motion System

- Library: **Framer Motion**
- Use for:
    - Sidebar toggle
    - Agent status changes
    - Chat message entry
    - Prompt dropdowns

### 🧊 Skeleton/Loading States

- Chat bubble shimmer
- Upload bar progress
- Typing dots/animated ellipsis for agents