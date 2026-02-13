# Design System: Fit & Fun Familien Lager

**Project:** Fit & Fun
**Type:** Private Event Management / Community
**Keywords:** family, ski, winter, invite-only, minimalist, mobile-first
**Stack:** Nuxt 3, Tailwind, shadcn-vue

## 1. Global Rules (CRITICAL)

### Accessibility
- **Contrast:** Text must meet WCAG AA (4.5:1) - minimal gray text usage.
- **Touch:** All interactive targets min 44x44px (Crucial for cold fingers/on-the-go usage).
- **Alt Text:** All gallery/archive images need alt text.
- **Focus:** Visible focus rings for keyboard navigation.

### Mobile-First
- **Font Size:** Base text 16px min.
- **Input Fields:** Font size 16px to prevent iOS zoom.
- **Spacing:** `p-4` or `gap-4` minimum for touch separation.
- **Navigation:** Hamburger menu or bottom bar for mobile; no hover-flyouts.

## 2. Color Palette

**Theme:** Winter Sports & Family Fun (Clean, Trustworthy, Energetic)

| Role | Color | Tailwind Class | Hex Context |
|------|-------|----------------|-------------|
| **Primary** | Winter Blue | `bg-blue-600` | Main actions, Headers |
| **Secondary** | Snow White | `bg-white` | Cards, Backgrounds |
| **Accent** | energetic Orange | `text-orange-600` | Highlights, badges |
| **Neutral** | Slate | `text-slate-900` | Main text |
| **Muted** | Slate Light | `text-slate-500` | Meta info, borders |
| **Success** | Emerald | `text-emerald-600` | Confirmations |
| **Error** | Red | `text-red-600` | Validation errors |

### Usage Rules
- Use `slate-50` or `slate-100` for page backgrounds to distinguish cards (`white`).
- Dark mode: `slate-950` background, `slate-800` cards.

## 3. Typography

**Font Stack:** System Sans (Inter, Helvetica, Arial) - Default Tailwind

| Element | Size | Weight | Line Height | Case |
|---------|------|--------|-------------|------|
| H1 | `text-3xl` (30px) | Bold | 1.2 | Title Case |
| H2 | `text-2xl` (24px) | Semibold | 1.3 | Title Case |
| H3 | `text-xl` (20px) | Semibold | 1.4 | - |
| Body | `text-base` (16px) | Regular | 1.6 | Sentence case |
| Small | `text-sm` (14px) | Medium | 1.5 | - |

### Rules
- Max line length: 65-75 chars (`max-w-prose`) for readability.
- Headings must have bottom margin (`mb-4`).

## 4. Component Styles (shadcn-vue + Tailwind)

### Buttons
- **Primary:** `bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm`
- **Secondary:** `bg-white border border-slate-200 hover:bg-slate-50 text-slate-900`
- **Ghost:** `hover:bg-slate-100 text-slate-700` (for strict utility)
- **Loading:** Show spinner, disable interaction.

### Cards
- **Style:** Flat with subtle border or light shadow.
- **Classes:** `bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden`
- **Padding:** `p-4` or `p-6`.

### Forms
- **Input:** `h-12` (48px) for touch friendliness.
- **Label:** `text-sm font-medium mb-1 block`.
- **Error:** `text-sm text-red-500 mt-1`.

## 5. Layout & Spacing

### Grid
- **Container:** `max-w-5xl mx-auto px-4`.
- **Columns:** Single column mobile, 2-3 cols desktop (`grid-cols-1 md:grid-cols-2`).

### Spacing Scale
- `gap-4` (16px) - Default component spacing.
- `my-8` (32px) - Section separation.
- `py-6` - Vertical padding for content blocks.

## 6. Anti-Patterns (DO NOT DO)
- ❌ **Touch:** Targets smaller than 44px (e.g., tiny "edit" links).
- ❌ **Color:** Low contrast gray text on gray backgrounds.
- ❌ **Performance:** Large unoptimized hero images (use WebP/responsive).
- ❌ **UI:** Generic browser alerts for errors (use Toast/Alert components).
- ❌ **Icons:** Emojis as UI icons (Use Lucide/Heroicons).

## 7. Tech Specifics (Nuxt/Vue)
- Use standard `NuxtLink` for internal nav.
- Use `Reusables` for repeated UI patterns.
- Image component: `NuxtImg` for optimization.
