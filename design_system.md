# Bridge Frontend - Design System

The design system is implemented using Tailwind CSS v4 and vanilla CSS variables (using the `oklch` color space) in `src/styles.css`.

## Typography

The project utilizes two main font families, leveraging modern sans-serifs for body text and a classic serif for display headings.

- **Display Font (`font-display`)**: `"Fraunces", "Georgia", serif`
  - Applied to `h1`, `h2`, `h3`, and the `.font-display` utility class.
  - Used with a slight tracking reduction (`letter-spacing: -0.02em;`).
- **Sans Font (`font-sans`)**: `"Inter", system-ui, sans-serif`
  - Set as the default font for the `body`.

## Color Palette

The project embraces a dual-mode (Light and Dark) color palette based entirely on the **`oklch`** color space.
The core aesthetic revolves around **Warm Parchment**, **Deep Emerald**, and an **Amber Accent**.

### Light Mode

- **Background**: `oklch(0.985 0.008 85)` _(Warm Parchment)_
- **Foreground**: `oklch(0.18 0.025 165)` _(Deep Emerald)_
- **Primary**: `oklch(0.36 0.07 165)`
- **Secondary**: `oklch(0.94 0.012 85)`
- **Accent**: `oklch(0.78 0.13 75)` _(Amber)_
- **Muted**: `oklch(0.95 0.01 85)`
- **Card / Popover**: `oklch(1 0 0)` _(Pure White)_
- **Border**: `oklch(0.88 0.012 85)`
- **Input**: `oklch(0.92 0.01 85)`
- **Ring**: `oklch(0.36 0.07 165)`
- **Success**: `oklch(0.55 0.13 160)`
- **Warning**: `oklch(0.72 0.15 70)`
- **Destructive**: `oklch(0.55 0.21 27)`

### Dark Mode

The dark theme relies on cool, deep purple/blue hues to contrast the warm light theme.

- **Background**: `oklch(0.129 0.042 264.695)`
- **Foreground**: `oklch(0.984 0.003 247.858)`
- **Primary**: `oklch(0.929 0.013 255.508)`
- **Secondary / Accent / Muted**: `oklch(0.279 0.041 260.031)`
- **Card / Popover**: `oklch(0.208 0.042 265.755)`
- **Border**: `oklch(1 0 0 / 10%)`
- **Input**: `oklch(1 0 0 / 15%)`
- **Ring**: `oklch(0.551 0.027 264.364)`

## Radii & Spacing

The project uses a structured scale for border radii, anchored by a base `--radius` variable.

- **Base Radius (`--radius`)**: `0.5rem` (`radius-lg` in Tailwind)
- **Derived Radii**:
  - `sm`: Base - 4px
  - `md`: Base - 2px
  - `xl`: Base + 4px
  - `2xl`: Base + 8px
  - `3xl`: Base + 12px
  - `4xl`: Base + 16px

## Custom Utilities

A few highly specific design utilities are injected into Tailwind's `@layer utilities` block:

- **`.bg-grain`**: Creates a subtle dotted pattern using a radial gradient `radial-gradient(oklch(0.36 0.07 165 / 0.04) 1px, transparent 1px)`. The dots are `18px` apart and leverage the Primary Emerald color at 4% opacity.
- **`.text-balance`**: Applies `text-wrap: balance;` to ensure evenly wrapped lines for large headings.
