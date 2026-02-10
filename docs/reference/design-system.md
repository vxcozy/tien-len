# Design System Reference

Authoritative reference for the Tien Len visual design system -- every CSS custom
property, Tailwind v4 theme binding, typography choice, button class, animation
utility, and texture pattern defined in `globals.css` and `layout.tsx`.

---

## Color Palette

All colors live as CSS custom properties on `:root` and are exposed to Tailwind v4
through the `@theme inline {}` block.

### Core Colors

| Property | Value | Tailwind Class | Purpose |
|---|---|---|---|
| `--background` | `#3a2212` | `bg-background` | Page background, warm dark brown |
| `--foreground` | `#fff8e7` | `text-foreground` | Default body text, warm off-white |

### Felt (Table Surface)

| Property | Value | Tailwind Class | Purpose |
|---|---|---|---|
| `--felt` | `#c8a45c` | `bg-felt` | Base felt tone |
| `--felt-light` | `#dcc07a` | `bg-felt-light` | Inner radial highlight |
| `--felt-dark` | `#a88638` | `bg-felt-dark` | Outer radial edge |
| `--felt-highlight` | `rgba(255, 230, 150, 0.25)` | -- | Translucent center glow (CSS only) |

### Wood (Rail Border)

| Property | Value | Tailwind Class | Purpose |
|---|---|---|---|
| `--wood` | `#6b3520` | `bg-wood` | Base wood rail |
| `--wood-light` | `#8b4a2a` | `bg-wood-light` | Rail highlight |
| `--wood-dark` | `#4a2010` | `bg-wood-dark` | Rail shadow |

### Gold Accents

| Property | Value | Tailwind Class | Purpose |
|---|---|---|---|
| `--gold` | `#ffc107` | `bg-gold` / `text-gold` | Primary accent, CTAs |
| `--gold-glow` | `rgba(255, 193, 7, 0.5)` | -- | Glow keyframes (CSS only) |

### Card Colors

| Property | Value | Tailwind Class | Purpose |
|---|---|---|---|
| `--card-white` | `#faf8f3` | `bg-card-white` | Card face background |
| `--card-red` | `#e11d48` | `text-card-red` | Hearts and Diamonds pips |
| `--card-black` | `#1a1a2e` | `text-card-black` | Spades and Clubs pips |
| `--card-back` | `#7b2d3b` | `bg-card-back` | Card back base fill |

### Surface and UI Chrome

| Property | Value | Tailwind Class | Purpose |
|---|---|---|---|
| `--surface` | `#2c1a0e` | `bg-surface` | Panel backgrounds |
| `--surface-hover` | `#3d2818` | `bg-surface-hover` | Panel hover state |
| `--border` | `#6b4f38` | `border-border` | Default border color |
| `--text-muted` | `#c4a880` | `text-text-muted` | Secondary / muted text |

### Accent Rainbow

| Property | Value | Tailwind Class |
|---|---|---|
| `--accent-blue` | `#3b82f6` | `text-accent-blue` |
| `--accent-red` | `#ef4444` | `text-accent-red` |
| `--accent-purple` | `#a855f7` | `text-accent-purple` |
| `--accent-pink` | `#ec4899` | `text-accent-pink` |
| `--accent-teal` | `#14b8a6` | `text-accent-teal` |
| `--accent-green` | `#22c55e` | `text-accent-green` |
| `--accent-orange` | `#f97316` | `text-accent-orange` |
| `--accent-indigo` | `#6366f1` | `text-accent-indigo` |

### Avatar Ring Gradient

Eight colors for the rainbow conic-gradient around player avatar rings.

| Property | Value | Seat |
|---|---|---|
| `--avatar-1` | `#ef4444` | Red |
| `--avatar-2` | `#f97316` | Orange |
| `--avatar-3` | `#eab308` | Yellow |
| `--avatar-4` | `#22c55e` | Green |
| `--avatar-5` | `#3b82f6` | Blue |
| `--avatar-6` | `#a855f7` | Purple |
| `--avatar-7` | `#ec4899` | Pink |
| `--avatar-8` | `#14b8a6` | Teal |

### Banner and Badge

| Property | Value | Tailwind Class | Purpose |
|---|---|---|---|
| `--banner-red` | `#c0392b` | `bg-banner-red` | Ribbon banner base |
| `--banner-red-light` | `#e74c3c` | `bg-banner-red-light` | Ribbon banner highlight |
| `--badge-red` | `#dc2626` | `bg-badge-red` | Notification badges |
| `--crown-gold` | `#ffd700` | `text-crown-gold` | Winner crown icon |

---

## Typography

Fonts are loaded via `next/font/google` in `layout.tsx` and set as CSS variables.

| Font | CSS Variable | Tailwind Class | Usage |
|---|---|---|---|
| **Geist Sans** | `--font-geist-sans` | `font-sans` | Body text, UI labels, card values |
| **Ma Shan Zheng** | `--font-brush` | `font-brush` | Decorative headings, game title, banners |

Body default: `font-family: var(--font-sans), system-ui, sans-serif`. Apply
`font-brush` for calligraphic brush-stroke display text.

---

## Tailwind v4 Theme Configuration

Tailwind v4 replaces `tailwind.config.js` with the `@theme inline {}` block in
CSS. Every `:root` property is mapped into Tailwind's color namespace so utilities
like `bg-felt`, `text-gold`, and `border-border` work automatically.

```css
@theme inline {
  --color-background: var(--background);
  --color-felt: var(--felt);
  --color-gold: var(--gold);
  --color-card-white: var(--card-white);
  --color-surface: var(--surface);
  /* ...every color from :root follows the same --color-<name> pattern */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-brush: var(--font-brush);
}
```

To add a new color: declare it in `:root`, then add a `--color-<name>` entry
inside `@theme inline {}`. Tailwind generates `bg-<name>`, `text-<name>`,
`border-<name>`, and all other color utilities automatically.

---

## Button Classes

All buttons share a 3D mobile-game aesthetic: gradient fills, inset highlights,
bottom-border depth, and hover/active/disabled states.

### `btn-primary` -- Red CTA

- **Gradient:** `#e74c3c` to `#a93226`
- **Depth border:** 4px solid `#7b241c`
- **Text:** white, weight 900, uppercase
- **Hover:** lifts 2px, intensifies glow
- **Active:** presses down 2px, flattens shadow
- **Disabled:** grey gradient, 60% opacity

### `btn-secondary` -- Gold CTA

Gold/amber gradient for secondary actions (e.g., "Join Game").

- **Gradient:** `#f0c040` to `#b8860b`
- **Depth border:** 4px solid `#8b6914`
- **Text:** `#3d1f00` (dark brown), weight 900, uppercase
- **Hover/Active/Disabled:** same mechanical pattern as primary

### `btn-ghost` -- Outline

Subtle gold-bordered outline button for tertiary actions.

- **Background:** 5% white overlay
- **Border:** 2px solid, 30% gold opacity
- **Text:** `#f0c040`, weight 700, uppercase

### `btn-utility` -- Small Amber Glass

Compact button for in-game utilities (Sort, Copy Room Code).

- **Background:** semi-transparent brown glass gradient
- **Border radius:** 12px (tighter than other buttons)
- **Font size:** 12px, weight 700, uppercase
- **Text color:** `#e8c870`

### `btn-home-solo` -- Home Solo Play

Red-envelope style gradient (deep Chinese red to gold) with a solid gold border.

- **Gradient:** `#7a0000` to `#daa520` at 135 degrees
- **Border:** 3px solid `#8b6914`
- **Text:** `#ffd700` (pure gold), weight 900

### `btn-home-multi` -- Home Multiplayer

Inverse of solo: gold to deep Chinese red gradient, same gold border frame.

- **Gradient:** `#daa520` to `#7a0000` at 135 degrees
- **Border:** 3px solid `#8b6914`
- **Text:** `#ffd700`, weight 900

---

## Texture and Table Patterns

| Class | Description |
|---|---|
| `.felt-texture` | Double radial gradient: translucent `--felt-highlight` center glow over a `--felt-light` to `--felt-dark` gradient |
| `.felt-diamond` | Repeating 45-degree crosshatch at 2% white opacity, simulates woven cloth |
| `.card-back-pattern` | Four offset `linear-gradient` layers at 8% white opacity on a 12px diamond grid |
| `.table-bottom-arc` | Dark maroon arc via `clip-path: ellipse()`, gradient from `#5c1a1a` to transparent |
| `.ribbon-banner` | Hexagonal clip-path for pointed name-label ribbons: `polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)` |

---

## Animation Classes

| Class | Keyframe | Duration | Behavior |
|---|---|---|---|
| `animate-pulse-glow` | `pulse-glow` | 1.5s infinite | Gold box-shadow throb for active turns |
| `animate-bomb-shake` | `bomb-shake` | 0.5s once | Horizontal shake with rotation for bomb plays |
| `animate-bomb-glow` | `bomb-glow` | 0.8s x2 | Red box-shadow pulse for bomb plays |
| `animate-confetti` | `confetti-fall` | 3s forwards | Pieces fall from top and fade out |
| `animate-celebrate` | `celebrate` | 0.6s once | Scale bounce with slight rotation |
| `animate-bounce-gentle` | `bounce-gentle` | 1.2s infinite | Subtle vertical bounce for turn indicator |
| `animate-card-glow` | `card-glow` | 1.5s infinite | Gold glow pulse on selected cards |
| `animate-sparkle` | `sparkle` | 2s infinite | Opacity + scale throb for decorations |
| `animate-fade-in-up` | `fade-in-up` | 0.4s once | Fade in while sliding up 12px |
| `waiting-dot-1` | `bounce-dots` | 1.4s infinite (0s delay) | First dot of "waiting" indicator |
| `waiting-dot-2` | `bounce-dots` | 1.4s infinite (0.2s delay) | Second dot |
| `waiting-dot-3` | `bounce-dots` | 1.4s infinite (0.4s delay) | Third dot |

### Card Transform Utilities

| Class | Effect |
|---|---|
| `.backface-hidden` | Hides the reverse face during 3D card flip |
| `.rotate-y-180` | Rotates element 180 degrees on the Y axis |

---

## Design Rationale

The visual language is inspired by Vietnamese and Chinese festive aesthetics
-- red-and-gold color pairings, brush-script typography, and the tactile warmth
of a real card table. The 3D button depth, gold-accented borders, and felt
textures aim for a premium mobile-game feel while keeping the interface readable
on small screens. Every surface color was chosen to maintain sufficient contrast
against the warm brown background and golden felt.
