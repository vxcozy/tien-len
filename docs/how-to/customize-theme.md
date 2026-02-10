# How to Customize the Theme

This guide walks through every layer of the Tien Len visual theme -- colors, fonts, buttons, cards, and utility classes -- so you can reshape the look of the app without touching component logic.

All changes happen in two files:

- `apps/web/src/app/globals.css` -- CSS custom properties, button classes, animations
- `apps/web/src/app/layout.tsx` -- font loading via `next/font/google`

## Prerequisites

- The project running locally (`npx pnpm --filter web dev`)
- A basic understanding of CSS custom properties and Tailwind v4

---

## 1. Change the color palette

Every color in the app flows from CSS custom properties declared in `:root`. Edit `globals.css` and update the values you want:

```css
:root {
  --background: #3a2212;   /* page background */
  --foreground: #fff8e7;   /* default text */

  --surface: #2c1a0e;      /* panel/card backgrounds */
  --surface-hover: #3d2818;
  --border: #6b4f38;
  --text-muted: #c4a880;

  --gold: #ffc107;          /* primary accent */
  --gold-glow: rgba(255, 193, 7, 0.5);
}
```

These variables are bridged into Tailwind via the `@theme inline {}` block directly below `:root`. Each entry maps a CSS variable to a Tailwind color token:

```css
@theme inline {
  --color-background: var(--background);
  --color-gold: var(--gold);
  /* ... */
}
```

After changing a `:root` variable, the corresponding Tailwind utility (e.g. `bg-gold`, `text-background`) updates automatically. You do not need to edit the `@theme` block unless you are adding a brand-new token.

## 2. Change the felt table color

The table surface uses three felt variables plus a highlight for the center glow:

```css
:root {
  --felt: #c8a45c;
  --felt-light: #dcc07a;
  --felt-dark: #a88638;
  --felt-highlight: rgba(255, 230, 150, 0.25);
}
```

The actual gradient is applied by the `.felt-texture` class:

```css
.felt-texture {
  background-image:
    radial-gradient(ellipse at 50% 45%, var(--felt-highlight) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 40%, var(--felt-light) 0%, var(--felt) 35%, var(--felt-dark) 100%);
}
```

To switch to a classic green felt, for example, replace the four values:

```css
--felt: #166534;
--felt-light: #22863a;
--felt-dark: #0d4020;
--felt-highlight: rgba(34, 197, 94, 0.2);
```

The `.felt-diamond` class adds a subtle repeating diamond overlay. You can adjust its opacity by changing the `rgba` alpha values inside that rule.

## 3. Swap fonts

Fonts are loaded in `layout.tsx` using `next/font/google`. The display font is Ma Shan Zheng, bound to the CSS variable `--font-brush`.

**Step 1.** Import the replacement font:

```tsx
import { Geist, Noto_Serif_SC } from "next/font/google";
```

**Step 2.** Initialize it with the same variable name:

```tsx
const brushFont = Noto_Serif_SC({
  weight: "700",
  variable: "--font-brush",
  subsets: ["latin"],
});
```

**Step 3.** Apply the variable class on `<body>`:

```tsx
<body className={`${geistSans.variable} ${brushFont.variable} antialiased ...`}>
```

The `@theme inline {}` block already maps `--font-brush` to `--font-brush`, so any component using `font-brush` in its Tailwind class picks up the new font with no further changes.

To swap the body/UI font, follow the same pattern with the `--font-geist-sans` variable and the `Geist` import.

## 4. Modify button styles

Buttons are defined as plain CSS classes in `globals.css`, not as Tailwind components. Each has four states: default, `:hover`, `:active`, and `:disabled`.

### Change the primary button color

Find `.btn-primary` and update the gradient stops. The three-stop gradient goes top-to-bottom, light-to-dark:

```css
.btn-primary {
  background: linear-gradient(180deg, #e74c3c 0%, #c0392b 50%, #a93226 100%);
  border-bottom: 4px solid #7b241c;  /* 3D depth edge */
  box-shadow:
    0 6px 20px rgba(192, 57, 43, 0.5),         /* outer glow */
    inset 0 1px 0 rgba(255, 255, 255, 0.25),    /* top shine */
    inset 0 -2px 4px rgba(0, 0, 0, 0.15);       /* bottom shade */
}
```

To make a blue primary button, replace all three layers:

```css
.btn-primary {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  border-bottom: 4px solid #1e3a8a;
  box-shadow:
    0 6px 20px rgba(37, 99, 235, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15);
}
```

Update the matching `:hover`, `:active`, and `::before` pseudo-element to keep the 3D illusion consistent.

### Adjust the ghost button border

`.btn-ghost` uses a translucent gold border. Change the border and text color together:

```css
.btn-ghost {
  border: 2px solid rgba(255, 193, 7, 0.3);
  color: #f0c040;
}
```

## 5. Change avatar ring colors

Player avatars use numbered ring colors `--avatar-1` through `--avatar-8`:

```css
:root {
  --avatar-1: #ef4444;  /* red */
  --avatar-2: #f97316;  /* orange */
  --avatar-3: #eab308;  /* yellow */
  --avatar-4: #22c55e;  /* green */
  --avatar-5: #3b82f6;  /* blue */
  --avatar-6: #a855f7;  /* purple */
  --avatar-7: #ec4899;  /* pink */
  --avatar-8: #14b8a6;  /* teal */
}
```

Each player is assigned a color by index. Replace any value to change that player slot's ring. Keep enough contrast against the dark `--wood` rail background so the rings stay visible.

## 6. Adjust card appearance

### Card back color

The card back uses `--card-back` for the base fill and `.card-back-pattern` for the diamond overlay:

```css
:root {
  --card-back: #7b2d3b;
}
```

The pattern opacity comes from the `rgba` values inside `.card-back-pattern`. Increase the `0.08` alpha for a more visible diamond grid:

```css
.card-back-pattern {
  background-image:
    linear-gradient(45deg, rgba(255,255,255,0.12) 25%, transparent 25%),
    /* ... repeat for other directions */;
}
```

### Card suit colors

Red suits (Hearts, Diamonds) use `--card-red`. Black suits use `--card-black`:

```css
--card-red: #e11d48;
--card-black: #1a1a2e;
```

The card face background is `--card-white`. A cream tone like `#faf8f3` mimics real playing cards; change it to pure `#ffffff` for a clean digital look.

## 7. Add new CSS utility classes

### Add a new color token

**Step 1.** Declare the variable in `:root`:

```css
:root {
  --accent-amber: #f59e0b;
}
```

**Step 2.** Register it as a Tailwind color inside `@theme inline {}`:

```css
@theme inline {
  --color-accent-amber: var(--accent-amber);
}
```

Now `bg-accent-amber`, `text-accent-amber`, `border-accent-amber`, and all other Tailwind color utilities work.

### Add a new animation

Define the keyframes and a utility class in `globals.css`:

```css
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

Use it in any component with `className="animate-slide-in-right"`.

### Add a new text utility

```css
.text-glow-gold {
  text-shadow: 0 0 8px var(--gold-glow), 0 0 20px rgba(255, 193, 7, 0.3);
}
```

---

## Verifying your changes

After editing, confirm the build still passes:

```bash
npx pnpm --filter web build
```

Then inspect the running dev server to check that colors, fonts, and button states all render correctly across the home screen, lobby, and game table views.
