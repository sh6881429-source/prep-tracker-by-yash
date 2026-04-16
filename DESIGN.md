# Design Brief

## Direction
Prep Tracker by Yash — A premium, modern study and gym tracking application with sophisticated visual hierarchy and smooth micro-interactions.

## Tone
Refined and professional premium aesthetic with bold navy-to-cyan color transitions; intentional high contrast and clean layouts that feel effortless and premium.

## Differentiation
Collapsible desktop sidebar + sticky mobile bottom navigation provide seamless, device-appropriate navigation while smooth card-lift animations and cyan accents create moments of visual delight.

## Color Palette

| Token      | OKLCH          | Role                              |
| ---------- | -------------- | --------------------------------- |
| background | 0.985 0.005 240 | Clean off-white premium backdrop  |
| foreground | 0.18 0.08 264  | Deep navy text, max contrast      |
| card       | 1 0 0          | Pure white elevated surfaces      |
| primary    | 0.18 0.08 264  | Deep navy, primary brand color    |
| secondary  | 0.48 0.22 264  | Royal blue, secondary actions     |
| accent     | 0.68 0.18 195  | Cyan, highlights & active states  |
| muted      | 0.93 0.01 240  | Soft gray, disabled/secondary     |

## Typography
- Display: Bricolage Grotesque — section headers, page titles, prominent labels
- Body: Plus Jakarta Sans — body text, labels, navigation items
- Scale: hero `font-display text-3xl font-bold`, h2 `font-display text-2xl`, label `font-body text-sm font-medium`, body `font-body text-base`

## Elevation & Depth
Cards elevated with soft navy shadows (0.12 opacity); desktop sidebar has subtle border-right; primary buttons use royal blue with cyan glow on hover; cards lift 4px on hover with shadow expansion.

## Structural Zones

| Zone      | Background      | Border                | Notes                                           |
| --------- | --------------- | --------------------- | ----------------------------------------------- |
| Header    | white card      | bottom border-border  | Logo + breadcrumb, desktop sidebar toggle       |
| Sidebar   | primary navy    | none                  | White icons/text, cyan accent on hover/active   |
| Content   | light gray bg   | —                     | Alternate card/muted-bg for rhythm              |
| Bottom Nav| white card      | top border-border     | Sticky mobile nav, cyan active indicator        |
| Cards     | white card      | subtle shadow         | Rounded lg, padding md, lift on hover           |

## Spacing & Rhythm
Base 0.75rem radius, section gaps 2rem vertical, card padding 1.5rem, micro-spacing 0.5rem; alternating background colors (card/muted) for visual rhythm in scrollable lists.

## Component Patterns
- Buttons: rounded md, navy bg, white text, cyan glow on hover, button-press animation on click
- Cards: rounded lg, white bg, shadow-card, padding md, card-lift on hover
- Badges: rounded full, navy/cyan/muted variants, inline text

## Motion
- Entrance: fade-in 0.4s ease-out for modals; slide-up 0.5s for page transitions
- Hover: card-lift 0.3s cubic-bezier on card + button hover; text color transition 0.2s
- Decorative: button-press 0.2s on click; pulse-soft on loading indicators
- Active: cyan text/border on sidebar items; smooth color transitions (all 0.3s ease)

## Constraints
- No raw hex or rgb colors — use semantic tokens only
- Desktop: sidebar always visible at 280px width, collapsible via header toggle button
- Mobile: bottom nav sticky, full width, spacing safe-bottom
- All interactive elements must respond to hover (color, shadow, or scale)
- Animations must use cubic-bezier or ease-out, never linear

## Signature Detail
Cyan accent glow on active/hover states paired with soft navy shadow depth creates a premium, futuristic-yet-refined aesthetic that feels intentional and sophisticated.
