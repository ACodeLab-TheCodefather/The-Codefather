# THE CODEFATHER — Public Website

Dark Techn portfolio site with an animated background, 20 switchable themes, and Arabic/English with RTL/LTR.

## Files
- `index.html` Home (hero, about, skills, featured projects, education timeline, CTA)
- `about.html` About & full skills with proficiency bars
- `projects.html` / `project.html?id=…` Project list with category filters and detail pages
- `contact.html` Contact form (validation, honeypot)
- `404.html` Not-found page
- `css/style.css` Styles and responsive layout
- `js/themes.js` The 20 official themes (HEX values are fixed; do not edit)
- `js/content.js` All text and data, bilingual `{ ar, en }`. Edit this file to change content.
- `js/app.js` Shell, theme/language switching, animated background, timeline, form
- `assets/img/` Logo mark (cropped from the emblem) and OG banner

## Run it
Open `index.html` in a browser, or serve the folder:
```
python3 -m http.server 8000
```
Then visit http://localhost:8000

## Replace the placeholders
Everything marked `PLACEHOLDER` in `js/content.js` is sample text: owner intro, about text, projects, and education events. Replace it with your real information. Put images in `assets/img/` and set the `image` fields to their paths.

## Behaviour
- Theme and language choices are saved in the browser (localStorage).
- Default: Dark Techn theme, Arabic (RTL).
- Motion respects `prefers-reduced-motion`.
- The contact form does not store messages yet. It validates the input and opens the visitor's email app with the message ready.

## Not included yet (from the V5 specification)
This package covers the public front end only. The following still need to be built:
- Backend, MySQL schema, and the admin dashboard (Phases 5–7)
- Login, 2FA, recovery codes, and the initial admin setup
- Saving contact messages to the database
- Media uploads, draft/publish workflow, backups, and notifications
- Server-rendered pages for real SEO (sitemap, robots.txt, per-page meta)

The site currently uses one shared script to render each page, so search engines see the shell only. Server rendering is planned for the SEO phase.

## Notes on the brief
- The spec tagline is **THINK • CODE • CREATE**, which is used on the site. The uploaded logo file shows "CODE • LEARN • BUILD • INNOVATE". Confirm which one to use.
- The education timeline uses sample years and events. Replace them with your real history.
