# Page: Who We Are

This is the most content-rich page. It covers the team story, geographic representation, ERG connections, and the full candidate roster. It exists in **both English and German** - edits need to be made in both language sections.

---

## File location
`pages/who-we-are/index.html`

---

## Structure overview

```
├── Language toggle (EN / DE buttons)
├── [EN section]
│   ├── Our Story (3 paragraphs)
│   ├── Region grid (Europe, Asia, Africa, Americas)
│   ├── ERG cards + disclaimer
│   ├── The Candidates (team grid)
│   ├── "A community for the global workforce..." statement
│   └── Footer banner
└── [DE section]
    └── (same structure, German text)
```

---

## How to edit the story text

Find the section that starts with:
```html
<h2 class="section-title">Our Story</h2>
```
The three `<p class="story-para">` blocks beneath it are the paragraphs. Edit the text inside them directly.

For German, find the equivalent section starting with:
```html
<h2 class="section-title">Unsere Geschichte</h2>
```

---

## How to add or remove a country from the region grid

Find the relevant region card, e.g.:
```html
<div class="region-card">
  <h4>Europe</h4>
  <ul>
    <li><img src="https://flagcdn.com/w20/de.png" alt="">Germany</li>
    ...
  </ul>
</div>
```

To **add** a country, copy an existing `<li>` line and:
- Change the 2-letter country code in the flag URL (`de`, `fr`, `es`, etc. - see [flagcdn.com](https://flagcdn.com))
- Change the country name

To **remove** a country, delete the entire `<li>...</li>` line.

---

## How to update the ERG list

Find the `erg-grid` div:
```html
<div class="erg-grid">
  <div class="erg-card"><span>Asia Pacific Community Circle</span></div>
  ...
</div>
```
Add or remove `<div class="erg-card"><span>ERG Name</span></div>` lines.

**Remember to update the disclaimer text below if the ERG list changes significantly.**

---

## How to update the candidate list

The candidate list is driven by the **v3 CSV** file (`archive/Candidates Details - v3.csv`). The rules are:

| Column | Rule |
|--------|------|
| `OK to share their name in Zlife post?` | Must be **YES** to appear on the page |
| `Zlife published` | Must be **YES** + link filled to show a clickable article card |
| `Link to the introduction` | The article URL used for the card link |

### Candidate card - no article yet (initials avatar, not clickable)
```html
<div class="team-card">
  <div class="team-avatar">AB</div>
  <div class="team-name">Alex Bauer</div>
  <div class="team-role">Senior Engineer</div>
</div>
```
- Replace `AB` with the person's initials (first + last name initial)
- Replace the name and role

### Candidate card - article published on zLife (photo, clickable)
```html
<a class="team-card" href="ARTICLE_URL" target="_top">
  <div class="team-avatar"><img src="PHOTO_URL" alt="Full Name" /></div>
  <div class="team-name">Full Name</div>
  <div class="team-role">Job Title</div>
  <div class="team-link-hint">Get to know me ↗</div>
</a>
```
- `ARTICLE_URL`: the zLife article link from the CSV (`Link to the introduction` column)
- `PHOTO_URL`: the Haiilo thumbnail URL - ask the team admin to extract this from the article's HTML source
- Keep `target="_top"` so the link opens in the full browser tab, not inside the iframe

### Candidate card - article exists but no photo
Same as above but replace the `<img>` with initials:
```html
<div class="team-avatar">AB</div>
```

### Important: edit BOTH language sections
The candidate grid appears twice - once in the English section and once in the German section. They are identical. Make the same change in both places.

Search for `<!-- The Candidates -->` and `<!-- Die Kandidatinnen und Kandidaten -->` to find each one quickly.

---

## How to get the photo URL for a candidate

The photo URLs come from the Haiilo/zLife platform and require a login to display. To find the URL for a new candidate's article:
1. Open the article on zLife in your browser
2. Right-click on the candidate's photo → "Inspect" or "Inspect Element"
3. Find the `<img>` tag - the `src` attribute is the photo URL
4. It will look like: `https://zlife.zalando.net/web/senders/56266ee2-.../documents/XXXXXXXX-...?type=XL`

Alternatively, ask the team admin - they can extract it from the HTML source of the listing page.
