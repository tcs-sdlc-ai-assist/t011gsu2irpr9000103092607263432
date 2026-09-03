# WriteSpace

WriteSpace is a responsive, local-first writing SPA for registering a local account, publishing plain-text stories, reading community posts, and demonstrating simple administrative controls. It is built with React, Vite, React Router, and Tailwind CSS.

**No backend, API, database, server-side authentication service, or remote data store is included.** All application data remains in the current browser's `localStorage`.

## Features

- Public landing page with recent-story previews
- Local account registration and sign-in
- Protected story list, reader, and create/edit/delete workflow
- Owner and Admin post-management checks
- Demo Admin dashboard and local user management
- Responsive navigation: a compact menu on smaller screens, with stacked content below the mobile breakpoint, two-column story cards at medium widths, and three columns at large widths

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Public landing page and latest-story previews | Public |
| `/login` | Local account login | Public |
| `/register` | Local account registration | Public |
| `/blogs` | Authenticated story list | Signed-in user |
| `/blog/:id` | Authenticated story reader | Signed-in user |
| `/write` | Create a story | Signed-in user |
| `/edit/:id` | Edit or delete an owned story | Owner or Admin |
| `/admin` | Administration dashboard | Admin only |
| `/users` | Local user management | Admin only |

Unknown routes redirect to `/`.

## Local development

All commands use direct Node entry points so they work where package-manager bin links are unavailable.

```sh
cd frontend
node node_modules/vite/bin/vite.js
```

The dev server prints its local URL. To create a production static bundle:

```sh
cd frontend
node node_modules/vite/bin/vite.js build
```

## Tests

Run the complete Vitest suite:

```sh
cd frontend
node node_modules/vitest/vitest.mjs run
```

Run the cross-feature integration flow only:

```sh
cd frontend
node node_modules/vitest/vitest.mjs run src/integration/AppFlow.test.jsx
```

Run browser E2E specifications (the Playwright configuration starts a local Vite server at `127.0.0.1:4173`):

```sh
cd frontend
node node_modules/@playwright/test/cli.js test --config playwright.config.js
```

## Browser-local storage schemas

WriteSpace stores JSON arrays or objects under these keys:

- `writespace_users`: array of local account records: `{ id, displayName, username, password, role }`.
- `writespace_session`: current public session: `{ userId, username, displayName, role }`; it intentionally omits the password.
- `writespace_posts`: array of stories: `{ id, title, content, authorId, authorName, authorRole, createdAt }`.

Clearing site data, using a different browser profile, or using another device removes or separates this local data. There is no synchronization, backup, migration, or account recovery.

## Privacy and security limitations

This is a local demonstration application, not a production security system. Registered credentials are stored as **plaintext** in the browser's local storage. Authorization is enforced only by client-side route guards and mutation checks, so it is not a security boundary and must not be trusted for real users or sensitive content. Do not use real passwords or private material.

A local demo administrator is available with username `admin` and password `admin`. This account is for demonstration only.

## Vercel SPA routing

`vercel.json` contains exactly one rewrite: requests matching `/(.*)` are served `/index.html`. Vercel therefore returns the SPA entry document for direct visits and refreshes on client-side routes such as `/write` or `/blog/:id`; React Router then selects the appropriate page. The rewrite does not add a backend or API.

## License

Private and proprietary. All rights reserved.
