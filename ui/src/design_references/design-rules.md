# Hard Design Rules — PIP AI (React + Tailwind, CDO Brand)

## 1. **Spacing**

- Use `gap-6` or higher between stacked elements and rows.
- All containers and cards must have `p-6` (padding 1.5rem) minimum.
- No element or icon should be flush to the edge—add `px-4` or `py-2` as buffer everywhere.
- Top/bottom of sidebars and main areas must have at least `pt-8` and `pb-8`.

## 2. **Sizing**

- Sidebar: `w-20` (80px) on desktop, never wider unless in expanded mode.
- Main content: add `pl-20` to offset the sidebar (or use responsive grid).
- Icons: Always `w-7 h-7` (28px), centered in a circle, never larger or smaller.
- Text labels in nav: `text-xs`, `font-medium`, `tracking-widest`.

## 3. **White Space & Alignment**

- Always favor more white space; layouts should "breathe."
- Never crowd nav items, cards, or bubbles; use `gap-8` between major sections.
- No `w-full` on nav rows or sidebar icons—content must stay centered and spaced.

## 4. **Color and Brand**

- Only use #E60023 (`cdo-red`) for accents, active states, and borders—not for full backgrounds.
- Backgrounds must be `bg-white` or `bg-gray-50` for cards/areas; `bg-white/30 backdrop-blur` for glassy effects.
- Text must be `text-black` or `text-gray-700`—never light gray for main copy.

## 5. **Shadows & Depth**

- All floating elements (sidebar, cards, chat bubbles) must have `shadow-lg` or `shadow-md`.
- Never use default or no shadow for cards.

## 6. **Typography**

- Font: `font-sans` (Inter preferred).
- Headings: `text-xl` or larger, bold.
- Body: `text-base`, normal weight.
- Nav/labels: `text-xs` or `text-sm`, `font-medium`.

## 7. **Responsiveness**

- Sidebar is always fixed on left (desktop), slides over on mobile.
- Main content adapts (`pl-20` desktop, `pl-0` mobile).
- All buttons, inputs, and icons must be comfortably tappable (min `h-10`, `w-10`).

## 8. **Accessibility**

- All nav items, buttons, and interactive elements must have `focus:ring-2 focus:ring-cdo-red`.
- Always add `aria-label` to nav links and icon buttons.

## 9. **Hover and Active States**

- On hover: `bg-gray-100` for nav/items; never remove padding.
- On active nav: left border `border-l-4 border-cdo-red`, or icon/text in `text-cdo-red`.

## 10. **General**

- Err on the side of "more space, more padding, more gap."
- If unsure, double the spacing from your first guess.
- Never use cramped layouts—modern SaaS is generous and clean.

---

## Quick Reference Classes

### Spacing

```css
/* Minimum padding for containers */
.container-padding {
  @apply p-6;
}

/* Minimum gaps between elements */
.element-gap {
  @apply gap-6;
}
.section-gap {
  @apply gap-8;
}

/* Sidebar and main content offset */
.sidebar-width {
  @apply w-20;
}
.main-offset {
  @apply pl-20;
}
```

### Colors

```css
/* CDO Brand Red */
.cdo-red {
  color: #e60023;
}
.border-cdo-red {
  border-color: #e60023;
}
.bg-cdo-red {
  background-color: #e60023;
}

/* Safe backgrounds */
.safe-bg {
  @apply bg-white;
}
.safe-bg-alt {
  @apply bg-gray-50;
}
.glass-bg {
  @apply bg-white/30 backdrop-blur;
}

/* Safe text colors */
.safe-text {
  @apply text-black;
}
.safe-text-muted {
  @apply text-gray-700;
}
```

### Icons & Interactive Elements

```css
/* Standard icon size */
.icon-size {
  @apply w-7 h-7;
}

/* Minimum touch target */
.touch-target {
  @apply min-h-10 min-w-10;
}

/* Focus states */
.focus-ring {
  @apply focus:ring-2 focus:ring-cdo-red;
}

/* Hover states */
.nav-hover {
  @apply hover:bg-gray-100;
}

/* Active states */
.nav-active {
  @apply border-l-4 border-cdo-red text-cdo-red;
}
```

### Typography Scale

```css
/* Navigation labels */
.nav-label {
  @apply text-xs font-medium tracking-widest;
}

/* Body text */
.body-text {
  @apply text-base text-black;
}

/* Headings */
.heading {
  @apply text-xl font-bold text-black;
}
```

---

## Component Examples

### Sidebar Navigation Item

```jsx
<button className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-cdo-red transition-colors">
  <Icon className="w-7 h-7 text-gray-600" />
  <span className="text-xs font-medium tracking-widest text-gray-700">
    LABEL
  </span>
</button>
```

### Card Container

```jsx
<div className="bg-white p-6 rounded-lg shadow-lg">
  {/* Card content with minimum p-6 padding */}
</div>
```

### Main Layout

```jsx
<div className="flex">
  <aside className="w-20 fixed left-0 top-0 h-screen bg-white shadow-lg pt-8 pb-8">
    {/* Sidebar content */}
  </aside>
  <main className="pl-20 w-full pt-8 pb-8">
    {/* Main content with proper offset */}
  </main>
</div>
```
