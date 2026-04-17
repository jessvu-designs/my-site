# Jess — Personal Portfolio Site

A personal portfolio and contact site for Jess, a research-driven product designer.

## Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `index.html` | Hero, portfolio cards, client logo carousel |
| Work | `pages/work.html` | Filterable case study grid |
| Contact | `pages/contact.html` | Contact form + details |

## Project Structure

```
my-site/
├── index.html          # Homepage
├── app.js              # JS: weather widget, work filters, nav active state
├── css/
│   └── styles.css      # Global styles
├── assets/             # Images and thumbnails
└── pages/
    ├── work.html       # Work/portfolio page
    ├── contact.html    # Contact page
    └── projects/       # Individual project pages
```

## Tech

- Vanilla HTML, CSS, JavaScript — no build tools or frameworks
- Responsive layout using CSS Grid and Flexbox
- CSS custom properties for theming

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--primary-color` | `#1a1a1a` | Body text, headings |
| `--secondary-color` | `#ffffff` | Background, nav |
| `--accent-color` | `#e91e8c` | Accent elements |
| `--text-gray` | `#666666` | Secondary text |
| Footer/CTA pink | `#B5177E` | Footer bg, buttons, active states |

## Running Locally

Open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Accessibility

- Semantic HTML throughout (`<header>`, `<nav>`, `<section>`, `<footer>`, `<form>`, `<ul>/<li>`)
- All interactive elements are keyboard-accessible with visible focus styles
- Form inputs have associated `<label>` elements and `required` attributes
- SVG icons use `aria-hidden="true"` and `focusable="false"` to avoid screen reader duplication
- Decorative/duplicate content (e.g. carousel clones) marked with `aria-hidden="true"`
- Client logo list uses `role="img"` + `aria-label` on each item with a `<title>` fallback inside the SVG
- Color contrast meets WCAG AA — e.g. white text on `#B5177E` (~5.2:1) and `#052A4F` (~10:1)
- Logo carousel respects `prefers-reduced-motion` — falls back to a static wrapped grid

## Responsiveness

| Breakpoint | Behaviour |
|------------|-----------|
| `> 900px` | 3-column work grid |
| `≤ 900px` | 2-column work grid |
| `≤ 768px` | Hero text scales down; single-column portfolio |
| `≤ 700px` | Footer stacks vertically; sticky work header adjusts top offset; contact page stacks to single column |
| `≤ 600px` | 1-column work grid |
| `≤ 480px` | Nav stacks; hero padding reduced; weather location hidden |

Layout is built with CSS Grid and Flexbox — no fixed pixel widths on content containers. Images use `max-width: 100%` and `object-fit: cover` to scale gracefully.
