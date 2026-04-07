# Page: Our Values

This page displays the 6 core values of GWC as cards with an emoji icon, title, and short description.

---

## File location
`pages/values/index.html`

---

## Structure overview

```
├── Page header + subtitle
├── Hero intro paragraph
├── 6 Value cards (grid layout)
└── Footer banner
```

---

## How to edit a value card

Each card looks like this:
```html
<div class="value-card">
  <div class="value-icon">⚖️</div>
  <h3>Fairness</h3>
  <p>Short description of this value...</p>
</div>
```
- Change the emoji in `<div class="value-icon">`
- Change the value name in `<h3>`
- Change the description in `<p>`

There are **6 value cards** total. They display in a 3-column grid on desktop and stack on mobile.

---

## How to add a new value card

Copy an existing card block and paste it after the last `</div>` before `</div> <!-- end values-grid -->`. Edit the emoji, title, and description.

> Note: The grid adjusts automatically - no CSS changes needed to add a 7th card.

---

## How to remove a value card

Delete the entire block from `<div class="value-card">` to its closing `</div>`.
