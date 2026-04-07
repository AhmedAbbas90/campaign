# Mission Page v2 - Component Breakdown

Split into separate Haiilo widgets to eliminate double-scrollbar issues on mobile.
Rich text widgets use inline styles (Haiilo preserves these via Froala editor).
Only interactive components use iframes.

## Files

- `rich-text-widgets.html` - Copy-paste HTML blocks for each rich text widget (EN + DE versions)
- `lang-toggle.html` - Language toggle iframe (writes to localStorage)
- `principles.html` - Principle cards iframe (reads language from localStorage)
- `closing.html` - Closing paragraph iframe (reads language from localStorage)

## Haiilo Widget Setup (top to bottom)

| # | Widget | Type | Height | Source |
|---|--------|------|--------|--------|
| 1 | Logo | iframe | 200px | `../mission/logo.html` |
| 2 | Language toggle | iframe | 60px | `lang-toggle.html` |
| 3 | Tagline | rich text | auto | `rich-text-widgets.html` → Widget 1 (EN) or 1-DE |
| 4 | Section title + intro + lead | rich text | auto | `rich-text-widgets.html` → Widget 2 (EN) or 2-DE |
| 5 | Principle cards | iframe | ~900px | `principles.html` |
| 6 | Closing paragraph | rich text | auto | `rich-text-widgets.html` → Widget 3 (EN) or 3-DE |
| 7 | Closing banner | rich text | auto | `rich-text-widgets.html` → Widget 4 |

## Language switching

- **Iframes**: `lang-toggle.html` writes `gwc-lang` to localStorage. Other iframes read it on load + poll every 500ms.
- **Rich text widgets**: Haiilo doesn't support dynamic lang switching in rich text. Two options:
  1. Show both EN and DE in the same widget (separated by a divider)
  2. Create separate EN and DE versions and show only one (requires manual toggle on Haiilo side)

## Height variance

| Component | Desktop | Mobile | Variance | Type |
|-----------|---------|--------|----------|------|
| Logo | 200px | 200px | 0 | iframe |
| Lang toggle | 60px | 60px | 0 | iframe |
| Tagline | auto | auto | 0 | rich text |
| Intro text | auto | auto | 0 | rich text |
| Principles | ~850px | ~1100px | ~250px | iframe |
| Closing para | auto | auto | 0 | rich text |
| Banner | auto | auto | 0 | rich text |
| **Total iframe variance** | | | **~250px** | |

vs. current single-iframe variance of ~2000px+
