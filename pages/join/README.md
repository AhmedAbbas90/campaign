# Page: Join the Movement

This page has two forms: one for people who want to get involved with the campaign, and one for anyone who wants to share feedback anonymously or not. Both forms submit to Google Forms behind the scenes.

---

## File location
`pages/join/index.html`

---

## Structure overview

```
├── Voting info banner (red CTA block)
├── 3 voting info cards (dates, location, eligibility)
├── Hero intro paragraph
├── Form 1: "Support Our Team" (volunteer sign-up)
├── Form 2: "Share Your Feedback"
└── Footer banner
```

---

## How to update the voting info cards

Find the 3 cards near the top of the file inside the `vote-info-grid`:
```html
<div class="vote-info-card">
  <div class="vote-info-icon">📅</div>
  <div class="vote-info-label">When</div>
  <div class="vote-info-value">March 2026</div>
</div>
```
Edit the `vote-info-value` text for each card (When, Where, Who Can Vote).

---

## How to update the department dropdown (Form 1)

Find the `<select id="joinDept">` block:
```html
<select id="joinDept" name="entry.XXXXXXX">
  <option value="">Select your department</option>
  <option value="Tech">Tech</option>
  <option value="Product">Product</option>
  ...
</select>
```
Add or remove `<option>` lines to change the list of departments.

> **Important:** Do not change `id="joinDept"` or the `name="entry.XXXXXXX"` attribute - these are tied to the Google Form.

---

## How to update the involvement checkboxes (Form 1)

Find the checkbox group inside Form 1:
```html
<label class="checkbox-label">
  <input type="checkbox" name="entry.XXXXXXX" value="🎉 Help Organize Events" />
  🎉 Help Organize Events
</label>
```
To add a new checkbox, copy one of these blocks and change the `value` and the visible label text (they should match).

> **Important:** Do not change the `name="entry.XXXXXXX"` attribute.

---

## How to update the feedback type dropdown (Form 2)

Find `<select id="fbType">`:
```html
<option value="Suggestion">Suggestion</option>
<option value="Concern">Concern</option>
...
```
Add or remove `<option>` lines as needed.

---

## How the forms submit

Both forms post directly to Google Forms using a hidden request - no page reload happens. If the submission succeeds, a green success message appears. If something goes wrong (network error, timeout after 8 seconds), a red error toast appears.

**To change the Google Form endpoint**, you'd need to update the `fetch` URL in the `<script>` section at the bottom of the file. This requires access to the Google Form and is best done by the team admin.

---

## How to update the intro text

Find `<p class="hero-intro">` and edit the paragraph text inside it.
