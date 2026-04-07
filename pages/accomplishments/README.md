# Page: Accomplishments

This page will track what GWC has delivered once the Works Council term begins - milestones, active negotiations, and honest acknowledgement of shortcomings. It is currently a placeholder with "Coming soon" timeline items.

---

## File location
`pages/accomplishments/index.html`

---

## Structure overview

```
├── Hero intro paragraph (accountability statement)
├── Timeline (vertical list of milestones)
├── "Active Negotiations" section (placeholder)
├── "Where We Fell Short" section (placeholder)
└── Footer banner
```

---

## How to add a timeline milestone

Find the `<div class="timeline">` block. Each milestone looks like:
```html
<div class="timeline-item">
  <div class="timeline-date">Q1 2026</div>
  <div class="timeline-content">
    <h3>Milestone Title</h3>
    <p>What was achieved and why it matters.</p>
  </div>
</div>
```
Copy one of the existing items and paste it after the last `</div>` before `</div> <!-- end timeline -->`. Update:
- `timeline-date`: The time period (e.g. `March 2026`, `Q2 2026`)
- `h3`: Short title of the milestone
- `p`: What happened and its impact

---

## How to remove a placeholder item

Delete the entire `<div class="timeline-item">...</div>` block for any item you want to remove.

---

## How to fill in the placeholder sections

Find:
```html
<div class="placeholder-block">
  <p>Content coming soon...</p>
</div>
```
Replace the `<p>Content coming soon...</p>` with actual content. You can use any combination of `<p>`, `<ul>`, `<h3>` tags inside.

---

## How to edit the intro paragraph

Find `<p class="hero-intro">` near the top of the file and edit the text inside it.
