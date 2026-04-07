# Page: Our Mission

This page explains the three core principles of GWC. It is **fully bilingual** - the English and German versions are shown or hidden based on which language button the user clicks.

---

## File location
`pages/mission/index.html`

---

## Structure overview

```
├── Language toggle (EN / DE buttons)
├── [EN section]
│   ├── Mission tagline (red highlighted phrase)
│   ├── Intro paragraph
│   ├── Lead paragraph (bold)
│   ├── 3 Principle cards (⚡ Fighter, 🤝 No One Left Behind, 🔎 Radical Transparency)
│   └── Mission close box (red-tinted summary statement)
└── [DE section]
    └── (same structure, German text)
```

---

## How to edit the mission tagline

Find:
```html
<p class="mission-tagline">
  A Works Council That <span class="red">Stands for You</span>
</p>
```
The text inside `<span class="red">` appears in red. Edit the surrounding text or the red-highlighted phrase as needed.

---

## How to edit the intro paragraph

Find the `<p class="hero-intro">` block just below the tagline and edit the text inside it.

---

## How to edit a principle card

Find the section:
```html
<div class="principle-card">
  <div class="principle-icon">⚡</div>
  <h3>A Fighter in Your Corner</h3>
  <p>Description text here...</p>
</div>
```
- Change the emoji in `<div class="principle-icon">` if needed
- Change the title in `<h3>`
- Change the body text in `<p>`

There are 3 principle cards total. Each follows the same pattern.

---

## How to edit the closing statement box

Find:
```html
<div class="mission-close">
  <p>...</p>
</div>
```
Edit the paragraph inside it.

---

## Editing German text

Find the German section by searching for `id="section-de"`. All the same elements appear there with German text. Make sure any structural changes (adding/removing cards) are mirrored in both sections.
