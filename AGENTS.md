# AGENTS.md — FARADAY ENERGY landing

Static marketing site + PWA + admin panel for a Salta (AR) energy/construction company.
Spanish is the primary language (`index.html`, `pages/`); `en/` holds the English mirror.

## No build step — this is the most important fact

There is **no `package.json`, no bundler, no transpiler, no test suite, no linter config**.
Every file in the repo is the artifact that ships. Do not introduce a build pipeline, a
framework, or a dependency tree without being asked.

Consequence: HTML/CSS/JS are hand-edited in place, and the browser source is the source.

## Commands

Local preview must be served over **HTTP, not `file://`** — the service worker is skipped on
`file:` protocol, so `file://` previews hide SW bugs and the required paths in `sw.js`
(`PRE_CACHE` uses root-absolute `/css/...` URLs) will 404.

```powershell
python -m http.server 8123          # then open http://127.0.0.1:8123/
```

Lighthouse (what CI actually runs — `.github/workflows/ci.yml`, on push to `main` and on PRs):

```powershell
npm install -g @lhci/cli http-server
http-server -p 8123 -a 127.0.0.1 --silent
lhci autorun                        # reads lighthouserc.json
```

- **The port must be 8123.** `lighthouserc.json` hardcodes `http://localhost:8123/...` URLs; a
  different port silently audits nothing.
- Only 4 URLs are audited; thresholds are all `warn`, never `error`, so Lighthouse will not
  fail a build. Do not treat a green CI run as evidence that a page is fine.
- `document-title` and `html-has-lang` assertions are deliberately `off`.

Deploy:

```powershell
npx vercel --prod --yes
```

The Vercel project (`prj_UYVPEpkqehG7ediVr6fqNaAHwChF`, team `team_GRdpMgxyaEIIpJtPqFYOZ0J8`) is
**not connected to the GitHub remote**, so `git push` does not deploy. Pushing to
`github.com/facuherrera23/faraday` only affects the repo and CI. The build can exceed 300s —
raise the shell timeout rather than assuming a hang.

## Service worker: the #1 source of "my change didn't apply"

`sw.js` caches cache-first for same-origin assets and network-first for navigations.

- **Any edit to a file listed in `PRE_CACHE` (all css/js/html) requires bumping
  `var VERSION = 'v8';`.** Without the bump, installed clients keep serving the old file from
  cache and your change is invisible until the cache is manually cleared.
- A brand-new asset must be **added to `PRE_CACHE`** or it will never be precached.
- `PRE_CACHE` paths are root-absolute. A page opened from a subdirectory still resolves `/css/...`
  against the origin root, which is why the site assumes it is served from the domain root.
- Cache names are namespaced per `VERSION` (`faraday-precache-<VERSION>`); `activate` deletes
  every cache not in the current two, which is what makes the bump effective.
- `sw.js` also handles `push` and `notificationclick`; notification taps route to `/admin.html`.

## Three.js is loaded two different ways — keep both at r128

There are two independent copies of the same library version, for two different reasons:

1. **Landing page** (`index.html`, inline script near the end): r128 pulled from **CDN**
   (`cdnjs` + `jsdelivr`), loaded sequentially with `async = false`, then `js/hero-lightning.js`.
   - Bails out early on slow connections (`saveData`, `slow-2g`, `2g`).
   - `?webgl=off` disables it — use this query param for headless/screenshot debugging.
   - The vendor's `postprocessing/*.js` examples are non-module scripts that attach to the
     `THREE` global; they must load **in order after** `three.min.js`.
2. **Admin panel** (`admin.html`): the same r128 files are **self-hosted** under
   `js/vendor/three/` because extension/CDN blockers (Brave Shields) prevented the CDN copy from
   loading, which left the login bolt blank.
   - `admin.html` hardcodes the vendor script list; adding a file means editing that list.

Do not "deduplicate" these. Do not upgrade one without the other — both must stay on the r128
(non-module, global `THREE`) API, which is why the vendored `examples/js/` shims exist at all.

## Duplicated content — edit everywhere, or the site goes inconsistent

Shared marketing data is **copy-pasted across every page**, not templated. Verified: the main
phone number appears **92 times** across `index.html`, `pages/*.html`, `en/*.html`.
The service list is also duplicated in `js/quote-wizard.js` (`SERVICES`) and `js/admin.js`
(lead filter options).

The service catalogue is 10 services (note: the `/pages/servicio-*.html` set is the canonical
list). Changing a service name, phone, email, or address means sweeping all of the above.
There is no single source of truth to edit.

The repo root also contains gitignored one-shot content-migration scripts (`_fill_common.py`,
`_fill_index.py`, `_fill_pages.py`). They use assert-guarded string replacement, have already
been applied, and are **not** part of the shipped site or any workflow. Don't run them.

## House style: inline styles over utility classes, driven by CSS variables

Nearly all component styling is written as **inline `style="..."` attributes that reference
custom properties** from `css/tokens.css`, e.g.
`style="font-family:var(--font-mono);font-size:0.55rem;color:var(--gray-300)"`.
That is the established convention, not an oversight — do not refactor it into classes or a
utility framework. The five stylesheets (`tokens`, `base`, `layout`, `components`, `motion`)
carry resets, layout scaffolding, shared components, and animation.

Tokens that matter: `--gold: #ecb121` (primary accent), `--blue: #d2dcf2`, plus
`--gray-*` scale. Four type families, all intentional:
`--font-display` Archivo Black, `--font-serif` DM Serif Display, `--font-body` Space Grotesk,
`--font-mono` JetBrains Mono.

## Dormant integrations — do NOT "fix" these

Several scripts are opt-in and intentionally inert until configured. A placeholder value here is
the design, not a bug:

- `js/sentry-init.js` — no-ops unless `window.SENTRY_DSN` starts with `https://`.
- `js/analytics.js` — no-ops unless `window.PL_CONFIG.domain` is set and is not the
  `TU-DOMINO.IO` placeholder.
- `js/turnstile-config.js` — `enabled: false` with a `TURNSTILE_SITE_KEY_AQUI` placeholder.
  `window.TURNSTILE_READY()` is the gate; forms must respect it.

Admin (`js/admin.js`) runs in **DEMO mode** whenever `js/supabase-config.js` lacks real
credentials, or when the URL has `?demo=1`. Demo mode serves in-memory sample leads/users and
**never writes to Supabase**. Use `?demo=1` to work on the admin UI without touching production
data.

## Secrets and what must never be committed

This repo is public. `.pwa-signing/` is gitignored and holds the Android keystore, key
credentials, and VAPID private key — **never** commit any of it, and never copy its contents
into tracked files or docs.

Safe in tracked files: the Supabase URL + **anon** key and the **VAPID public** key
(`js/supabase-config.js`), which is how the client is meant to be configured.
The VAPID **private** key belongs only in Edge Function secrets.

`.gitignore` also excludes ~50 agent-tool directories (`.agents/`, `.claude/`, `.cursor/`, …),
`.vercel`, `COTIZACION.md`, `survey.txt`, `_fill_*.py`, and root `*.png` screenshots. Skills
present under `.claude/skills/` or `.agents/skills/` are **untracked local tooling** — editing
them changes nothing in the repo's history.

## Backend

Supabase project ref `uvkmmlmeumrownidhfqu`. SQL and setup docs live in `supabase/`
(`setup.sql`, `push-subscriptions.sql`, `SETUP.md`).

Edge Functions in `supabase/functions/` (`auto-reply`, `notify-team`, `send-push`) run on
**Deno** and import Node packages via `npm:` specifiers (e.g. `npm:web-push@3.6.7`). Deploying
them, running the SQL, and creating Database Webhooks requires the Supabase dashboard — there is
no CLI login for this project from a dev machine.

Web Push spans three places that must agree: `js/push.js` (subscribe),
`sw.js` (`push` handler), and the `send-push` function (send). The public key in
`js/supabase-config.js` must match the private key configured in the function's secrets.

## Android TWA

`downloads/faraday-admin.apk` is a Trusted Web Activity. `.well-known/assetlinks.json` holds the
SHA-256 fingerprint of the signing certificate. **If the APK is ever rebuilt with a different
key, `assetlinks.json` must be updated in the same change** or the TWA loses trust and falls back
to a browser tab with a URL bar.

## Windows / PowerShell environment

The shell is **Windows PowerShell 5.1**, not bash:

- No `&&`, no `export`. Use `;` and `cmd1; if ($?) { cmd2 }`.
- `Invoke-WebRequest` / `Invoke-RestMethod` for HTTP; `$env:VAR` for environment variables.

**Encoding trap:** the HTML/CSS/JS files are UTF-8 (em dashes, accents, box-drawing comment
banners). PowerShell 5.1's `Get-Content` and `Set-Content` default to ANSI and will **corrupt
non-ASCII characters on write**. Always read and edit these files with the Read/Write/Edit
tools, never by round-tripping through PowerShell cmdlets.

## Known loose ends (unresolved, not bugs to silently "fix")

- `robots.txt` and `sitemap.xml` point at `https://faradayenergy.com.ar/`, which does not
  currently resolve; production serves from `faraday-energy-landing.vercel.app`. Canonical/OG
  tags have the same mismatch. Changing this needs a domain decision, not a code change.
- `COTIZACION.md` is gitignored, out of date, and its figures are unconfirmed.
