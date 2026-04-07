# Page: Our Commitment

This page outlines the 4 main commitments and 10 core beliefs of GWC, plus two philosophy cards.

---

## File location
`pages/commitment/index.html`

---

## Structure overview

```
├── Hero intro paragraph
├── 4 Commitment cards (numbered)
├── 2 Philosophy cards ("We are transparent" / "We are inclusive")
├── "10 Things We Believe In" list
├── Contact footer (email link)
└── Footer banner
```

---

## How to edit the intro paragraph

Find `<p class="hero-intro">` near the top of the file and edit the text inside it.

---

## How to edit a commitment card

Each card looks like this:
```html
<div class="commitment-card">
  <div class="commitment-number">1</div>
  <div class="commitment-content">
    <h3>Commitment Title</h3>
    <p>Description text here...</p>
  </div>
</div>
```
- The number is purely visual - don't change it unless reordering
- Edit the `<h3>` for the title and `<p>` for the description

There are **4 commitment cards** in total.

---

## How to edit a philosophy card

```html
<div class="philosophy-card">
  <h4>We are transparent</h4>
  <p>Description...</p>
</div>
```
Edit the `<h4>` title and `<p>` description directly.

---

## How to edit the "10 Things We Believe In" list

Find:
```html
<ol class="beliefs-list">
  <li>First belief</li>
  <li>Second belief</li>
  ...
</ol>
```
Each `<li>` is one belief. Add, remove, or edit lines. The numbering is automatic.

---

## How to update the contact email

Find:
```html
<a href="mailto:someone@zalando.de">someone@zalando.de</a>
```
Replace the email address in both the `href="mailto:..."` and the visible text.
