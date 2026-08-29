# Design system, as implemented

This documents how the aesthetic file (`JACINTO_CONSTRUCTION_AESTHETIC.md`) was translated into code. The two tests from that file were applied to every screen: could this have come from a generic site generator, and would it still look right with every effect removed.

## Tokens

`src/styles/globals.css`, `:root`:

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#f4f0e8` | page background |
| `--paper-warm` | `#ede6da` | the About band, the mobile menu, admin banner |
| `--surface` | `#faf8f3` | contact form, admin background |
| `--white` | `#ffffff` | admin cards |
| `--ink` | `#1d211f` | text, the one dark section, ink buttons |
| `--ink-soft` | `#4e514c` | serif body copy |
| `--ink-muted` | `#63655d` | labels, metadata (darkened from the spec so 11 px labels keep AA contrast on paper and paper-warm) |
| `--line` / `--line-strong` | ink at 12% / 24% | hairlines |
| `--brick` / `--brick-deep` / `--clay` | `#9a4f32` / `#733923` / `#b76a49` | active indicators, focus, the Publish button, one datum line |
| `--olive` | `#626657` | published status, success notices |
| `--stone` / `--concrete` | `#b5aa99` / `#d4d0c7` | image backgrounds, placeholders |

Colour weight on a typical page: paper about 80%, ink about 15%, brick well under 5%. Brick appears as: the active year underline on the Projects page, the active nav underline, the underline of the language switch, the current menu number, the hero datum line, the focus ring, the sample tag, the Publish button in the admin, one square in the logo's two colour version. Nothing else.

## Type

Three voices, all self hosted variable fonts (`src/fonts`), loaded with `next/font/local` and `font-display: swap`.

- **Inter** (`--sans`): navigation, headings, project names, buttons, admin. Headings 650 to 700 weight, `-0.035em` to `-0.045em` tracking, line height 0.99 to 1.1.
- **EB Garamond** (`--serif`): intros, project statements, descriptions, About copy, the footer service line. 18 to 22 px body, 22 to 46 px for statements.
- **JetBrains Mono** (`--mono`): eyebrows, numbers, metadata, year filters, captions, admin status pills. 11 to 12 px, `0.08em` to `0.16em` tracking, uppercase.

Scale classes: `.display` (42 to 92 px), `.section-title` (30 to 56 px), `.title-md` (22 to 32 px), `.reflective`, `.reflective-lg`, `.eyebrow`, `.mono`.

The signature (assertive sans line, quieter serif line, small mono label) appears in the hero, the section heads, the project modules and the project page header, with different proportions each time rather than one repeated block.

## Layout

- Container: `min(100% - 2 * pad, 1240px)`, pad `clamp(20px, 4.5vw, 56px)`.
- Section rhythm: `clamp(64px, 9vw, 140px)`. Tighter (`.section-tight`) on index style pages.
- Twelve column grid on desktop through CSS Grid: hero 5/7, selected work 7/5 alternating with 5/7, About 6/6 or 9/3 without an image, contact close 7/5, project body 7/1/4, gallery rows full, 9 of 12 offset, 6/6 staggered pairs, 5 of 12 portraits offset left or right.
- Hairlines (`1px solid var(--line)`) separate index rows, metadata, filters, footer columns and the pager. No box shadows anywhere on the public site.
- Radii: 2 px on images, 4 px on buttons and admin fields. No pills.

## Photography

- `Picture` (`src/components/site/Picture.tsx`) renders `<img srcset sizes>` with three sizes and explicit `width`/`height`, so nothing shifts while loading. Aspect ratio comes from the real image; the hero and the projects index preview are the only fixed frames.
- Images sit on `--concrete` while loading and scale from 1.01 to 1.025 on hover on pointer devices only.
- Placeholders in `public/placeholders` are neutral warm fields with a project number, ratio and the words PROJECT IMAGE PLACEHOLDER. Nothing pretends to be a real photo.

## Motion

- Easing everywhere: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Reveal on entry: opacity 0 to 1, 14 px rise, 900 ms, 80 ms stagger through `--i`, runs once through an IntersectionObserver. Content is visible by default; the hidden state is only applied after the `js` class lands on `<html>`.
- Hero datum line: a 1 px brick line scales up once, 600 ms after load.
- Nav: transparent on paper at the top, `rgba(244,240,232,0.94)` plus a hairline after 24 px of scroll, height 72 to 60 px. Backdrop blur on desktop pointer devices only.
- Menu: full height paper panel, translate and fade 550 ms, links stagger 60 ms.
- Language prompt: bottom sheet on phones, centred panel on desktop, 550 ms.
- Index preview image: crossfade with a 1.015 scale, 900 ms.
- Buttons: rise 2 px, arrow moves 3 px, press scales to 0.985.
- Lightbox: 350 ms fade in, image fades from 0 at 1.01 scale when loaded.
- `prefers-reduced-motion: reduce` removes every translate, scale and transition and shows all content immediately.

## Components

- **Header**: mark plus stacked wordmark, three links with a brick underline for the current page, the language switch, phone button (desktop) or phone icon (mobile), Menu button (mobile).
- **Language switch**: one link that says the other language in full, `Español` on the English site and `English` on the Spanish site, 15 px Inter at 560 weight with a permanent brick underline and a 44 px tap height. It sits in the header on every page at every width (the wordmark, not the switch, gives way below 380 px), and appears again as `English / Español` in the phone menu and in the footer. No abbreviations, no flags, no icon only control.
- **Hero**: eyebrow, headline split one sentence per line, serif intro, ink and outline buttons, large project photo with a mono caption that links to the project.
- **Selected work**: numbered modules, image dominant, alternating sides, sample tag when relevant.
- **Project index preview**: numbered rows with name, location and year, hairlines, mono metadata. No images, so it does not duplicate the modules above.
- **About preview**: serif statement on a paper-warm band.
- **Contact close**: the one ink section, phone as the largest element.
- **Projects page**: one row of filters, `All` then the years that have published work, newest first (mono text with a brick underline on the current one, 44 px targets on phones). Rows show number, name, location and year. Desktop index with a sticky preview that changes on hover and focus, phone view as a vertical photo sequence.
- **Project page**: eyebrow crumb (`Projects / 2024`), title, metadata definition list under a hairline with Location, Year and Project value in 16 px Inter under mono eyebrows (the value row only exists when a value is set; nothing is rendered for an empty field), cover, serif statement made of the first paragraph of the description, the remaining paragraphs, the optional scope list with numbers, editorial gallery, before and after pairs, previous and next, quiet call to action.
- **Lightbox**: paper background, counter, arrows, swipe, keyboard, focus returns to the page.
- **Contact form**: specification sheet fields with bottom hairlines and a brick focus.
- **404**: `404`, "This page is not part of the build.", two actions.
- **Admin**: same tokens, white cards on the surface tone, obvious labels, a sticky Save bar, status pills built from small squares rather than coloured badges. The project editor is one card with five fields (name, year, project value, location, description), a photos card, and two collapsed disclosure cards, Optional details and Spanish translation, styled as plain summaries with a hint rather than as tabs or accordions. Photo items show thumbnail, number, cover tag, arrows, Set as cover and Remove; alt text, caption and grouping sit behind an Optional photo details disclosure inside the item. The Projects list groups rows under a mono year label.

## Logo

An original JC monogram (`public/brand`): a square cornered J and a square cornered C built from courses of equal thickness on a 48 by 40 grid. It reads at 16 px and prints in one colour. Files: `logo-mark.svg`, `logo-mark-brick.svg` (the J's step in brick), `logo-mark-paper.svg`, `logo-wordmark.svg` (Inter Bold outlined, so no font is needed), `logo-lockup.svg`, `logo-lockup-paper.svg`, `favicon.svg`, `apple-icon.png`, `logo-mark.png`, `logo-lockup.png`, `og-default.png` (social preview).

## Accessibility

- One `h1` per page, landmarks, skip link, semantic lists and definition lists.
- Visible brick focus ring on everything, including the language prompt and lightbox.
- Menu and lightbox use `<dialog>`: focus is trapped, Escape closes, focus returns to the opener.
- 44 px minimum targets on phones for links, buttons, filters and admin controls.
- Text contrast meets AA on paper: ink 14.3:1, ink-soft 7.1:1, ink-muted 5.2:1 (4.8:1 on paper-warm), brick-deep 7.9:1, paper on ink 14.3:1.
- Every photo has an alt text field; `{Project name}, project photo {N}` is written for it on upload, so no photo ships without alt text.
- No information is conveyed by colour alone (status pills carry text, the active year is underlined and marked current, the language switch is a text link with a `lang` attribute and a title).

## Self audit results

Checked at 320, 375, 390, 430, 768, 1024 and 1440 px with the browser tests and screenshots: no horizontal overflow, no console errors, no broken images, no card walls, no shadows, no gradients, no fake numbers, brick used as detail only, everything readable with animation off.
