# english with mr sabir

Premium, responsive spoken English learning website for Indian learners, especially Hindi-speaking users. The project is fully static and ready for GitHub Pages or any GitHub-based static hosting workflow.

## Highlights

- Multi-page premium frontend built with HTML, CSS, and modular JavaScript
- GitHub Pages friendly with no backend dependency
- Shared reusable shell for navigation, footer, theme, and data-driven sections
- Hindi to spoken English translator with live web translation first and local spoken-phrase fallback
- Login and signup pages with local browser storage
- Admin dashboard UI with local content management for:
  - homepage content
  - feature cards
  - lessons
  - translator phrases
  - practice exercises
  - testimonials
  - footer social links
- Optional smart frontend features:
  - dark mode
  - favorites
  - progress tracker
  - phrase of the day
  - word of the day
  - voice input UI
  - speech playback

## Project Structure

```text
.
|-- index.html
|-- features.html
|-- translator.html
|-- practice.html
|-- courses.html
|-- login.html
|-- signup.html
|-- admin.html
|-- README.md
`-- assets
    |-- css
    |   `-- styles.css
    `-- js
        |-- app.js
        |-- data.js
        |-- storage.js
        |-- page-home.js
        |-- page-features.js
        |-- page-translator-enhanced.js
        |-- page-practice.js
        |-- page-courses.js
        |-- page-login.js
        |-- page-signup.js
        |-- page-admin.js
        `-- translator-service.js
```

## How It Works

- `assets/js/data.js`
  Default site content, lessons, phrases, testimonials, practice tracks, and social links.
- `assets/js/storage.js`
  localStorage helpers for users, favorites, progress, theme, translator counts, and admin-managed content.
- `assets/js/translator-service.js`
  Live translator service and fallback logic used by the enhanced translator page.
- `assets/js/ui-components.js`
  Reusable site header, footer, avatar shortcut, and icon helpers.
- `assets/js/app.js`
  Shared shell bootstrapping, theme toggle, mobile nav, reveal animations, and toast system.
- `assets/js/page-*.js`
  Page-specific modules for rendering content and interactions.

## Admin Access

Admin changes are stored in the browser through `localStorage`. This makes the project work even on static hosting, but it also means admin authentication remains client-side and is not suitable for true production security. For a public deployment, move admin login to a backend or protected API.

## Local Use

You can open `index.html` directly in a browser, but running a lightweight local server is better for testing browser features like speech, clipboard, and module imports.

Example with Node:

```bash
npx serve .
```

Or use any static server you prefer.

## GitHub Pages Deployment

This project does not require a build step.

1. Push the project to a GitHub repository.
2. Go to `Settings -> Pages`.
3. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main` (or your preferred branch)
   - Folder: `/ (root)`
4. Save the settings.
5. GitHub Pages will publish the static files directly.

Because the site uses plain relative links like `features.html` and `assets/...`, it works cleanly on GitHub Pages under a repository path.

## Customization Notes

- Update branding, content, and placeholder social links in `assets/js/data.js`.
- Use the admin dashboard to change visible content without editing files.
- Replace or extend the live translation logic in `assets/js/translator-service.js` if you want to use your own proxy or paid API later.
- Replace static auth and admin logic with real API endpoints if you later add a backend.

## Suggested Next Upgrades

- Connect a real Hindi-to-English translation or AI API
- Add server-backed authentication
- Sync admin content with a CMS or database
- Add lesson detail pages and saved learner progress per account
- Add analytics and SEO metadata per page
