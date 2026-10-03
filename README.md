# InvestsProperty

A production-ready real estate listing website built with Next.js 16 (App
Router), TypeScript, and Tailwind CSS — built for **investsproperty.com**.

It follows the same functional layout pattern as large Indian property
portals (search bar, filterable project listings, project detail pages),
but with its own visual identity: a teal + gold palette, Fraunces/Inter
type system, and a RERA-verification "stamp" as the signature design
element. No text, images, or code were copied from any existing site.

## What's included

- **Homepage** — hero search, featured projects, trust section, WhatsApp CTA
- **Projects listing** (`/projects`) — filter by city, budget, BHK,
  possession status, RERA-registered only; sort by price or possession date.
  Filters work via plain URL query parameters (`/projects?city=Noida&bhk=3`),
  so every filtered view is a real, shareable, crawlable, SEO-friendly page.
- **Project detail pages** (`/projects/[slug]`) — gallery, price & config
  table, description, highlights, amenities, and contact card
- **Click-to-call**: a "View Number" button reveals the project's phone
  number and dials it via `tel:`
- **WhatsApp lead capture**: a WhatsApp button opens a chat with the
  project's WhatsApp number, pre-filled with an inquiry message — so the
  message lands directly in that number's WhatsApp inbox
- **SEO**: per-page metadata, Open Graph + Twitter cards, a dynamically
  generated OG image, `sitemap.xml`, `robots.txt`, and JSON-LD structured
  data (Organization, BreadcrumbList, ItemList, RealEstateListing)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project structure

```
app/                 pages (App Router) and API routes (app/api/** just re-export controllers)
  (site)/            public site: / and /about are static (SSG); /projects and
                     /projects/[slug] are server-rendered (SSR)
  admin/             admin panel (admins only)
components/
  ui/                Button, Field, Card, Badge…
  forms/             ImageUpload (reusable, ImageKit), LocationPicker (map), TagField
  map/               Leaflet / OpenStreetMap map (browser-only)
  property/          cards, filters, gallery, contact card, location map
  admin/ auth/ layout/
lib/                 shared, browser-safe code
  constants/         categories, property types, options
  utils/             format, slug, phone, maps, search-params, geocode, cn
  auth/jwt.ts        sign/verify the login JWT (also used by proxy.ts)
  api-client.ts      fetch helpers for /api/* and uploads
server/              server-only code
  db/                Drizzle schema + Neon client
  services/          business logic (property, user, auth, upload, revalidate)
  controllers/       request → validate → service → JSON response
  validators/        input validation for each controller
proxy.ts             page protection (Next.js 16's name for middleware.ts)
scripts/             create-admin
```

## Backend

- **Database:** Neon Postgres via Drizzle ORM (`server/db/schema.ts`). Tables
  `users` (serial id, name, email, password hash, role `admin` | `user`) and
  `properties` (serial id, auto-generated unique slug, full address, city, state,
  country, PIN, latitude/longitude, `isFeatured`, `isActive`, `isDeleted`…).
- **Auth:** email + password (bcrypt). There is no sign-up page or sign-up API: only
  admins sign in, at `/login`, and they are created with `npm run create-admin`.
  Repeated wrong passwords are throttled (10 per 15 minutes per IP and email). On login
  a JWT is stored in an httpOnly cookie. `proxy.ts` protects `/admin` (admins) and `/account` (any user);
  every API controller re-checks the user against the database.
- **Deleting is soft:** it sets `isDeleted = true`. Deleted listings disappear
  from the site and show under **Admin → Deleted**, where they can be restored.
- **Slugs** are generated from the title (`skyline-arte`, then `skyline-arte-2`
  if taken) and regenerated only when the title changes.
- **Uploads:** `POST /api/upload` (admins, multipart `file`, optional
  `folder`) stores the file on ImageKit and returns `{ url, fileId, … }`.
  `components/forms/ImageUpload.tsx` wraps it for use in any form.
- **Map:** admins pick the location by searching the address, clicking the map
  or dragging the pin. Property pages show the pin with "View on map" and
  "Directions" buttons (OpenStreetMap tiles; no API key needed).

### API

| Method | Path | Who | What |
|---|---|---|---|
| POST | `/api/auth/login` | anyone | sign in (sets the cookie) |
| POST | `/api/auth/logout` | anyone | sign out |
| GET | `/api/auth/me` | anyone | current user or `null` |
| GET | `/api/properties` | anyone | public search, same filters as `/projects` |
| POST | `/api/properties` | admin | create |
| GET / PUT / DELETE | `/api/properties/:id` | admin | read / update / soft delete |
| PATCH | `/api/properties/:id/status` | admin | `{ isFeatured?, isActive? }` |
| POST | `/api/properties/:id/restore` | admin | undo soft delete |
| POST | `/api/upload` | admin | upload to ImageKit, returns the URL |

## Database commands

```bash
npm run db:push        # apply schema changes in server/db/schema.ts to the database
npm run db:studio      # browse the database
npm run create-admin -- --email you@example.com --name "Your Name" --password "a-long-password"
```

`create-admin` also promotes an existing account to admin (and resets its password).

## Environment variables

Copy `.env.example` to `.env.local` and fill in `DATABASE_URL`, `JWT_SECRET` and
the three `IMAGEKIT_*` values (add the same variables in Vercel → Settings →
Environment Variables), plus:

- `NEXT_PUBLIC_SITE_URL` — your production domain (`https://investsproperty.com`),
  used for canonical URLs, the sitemap, and structured data.
- `NEXT_PUBLIC_DEFAULT_WHATSAPP` / `NEXT_PUBLIC_DEFAULT_PHONE` — the
  site-wide number used by the header's "Talk to an Expert" button and the
  footer (separate from each project's own number).

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Add the environment variables from `.env.example` in the Vercel project
   settings (Settings → Environment Variables).
4. Deploy. Vercel auto-detects Next.js — no extra config needed.
5. Once deployed, go to Settings → Domains and add `investsproperty.com` (and
   `www.investsproperty.com`), then update your domain's DNS records as
   Vercel instructs (usually an A record to `76.76.21.21` and a CNAME for
   `www`).
6. After the domain is live, submit `https://investsproperty.com/sitemap.xml`
   in Google Search Console so Google starts indexing project pages.

## SEO checklist already handled

- [x] Unique `<title>` and meta description per page, including filtered
      listing pages (e.g. "New Projects in Noida for Sale - 4 Properties")
- [x] Canonical URLs on every page
- [x] Open Graph + Twitter card metadata, with a dynamic OG image
- [x] `sitemap.xml` generated from the database (stays in sync
      automatically as you add/remove projects)
- [x] `robots.txt` pointing at the sitemap
- [x] JSON-LD: `RealEstateAgent` (site-wide), `BreadcrumbList` (every page),
      `RealEstateListing` (project pages), `ItemList` (listing pages)
- [x] Semantic HTML (`h1` per page, `<nav>`, `<main>`, `<footer>`, alt text
      on all images)
- [x] Static generation for every project detail page
      (`generateStaticParams`) — fast first load, good for SEO
- [x] Self-hosted fonts (no third-party Google Fonts request at runtime)

### SEO follow-ups worth doing before heavy marketing spend

- Register the site in Google Search Console and Bing Webmaster Tools.
- Once you have real project photos, add descriptive `alt` text per photo
  (currently the alt text is generated from the project name).
- If you expect many filter combinations to be found via search ads or
  social, consider adding `robots: noindex` to filter combinations that
  have near-duplicate content (e.g. very narrow multi-filter URLs), to
  avoid diluting crawl budget. Not necessary at your current listing count.

## Growing this project

Natural next steps as the catalogue grows:

- **Lead tracking**: set `NEXT_PUBLIC_GA_ID` to enable Google Analytics 4. It
  records page views plus `view_number`, `call_click` and `whatsapp_click`
  events (with `project_name`) — add a CRM webhook to capture these as leads.
- **Real map integration** on project detail pages (Google Maps or
  Mapbox embed) once you have real coordinates per project.

## Tech stack

- Next.js 16 (App Router, TypeScript, Server Actions)
- Postgres (Neon) via Drizzle ORM
- JWT auth (jose) in an httpOnly cookie, bcrypt passwords
- ImageKit for uploads; Leaflet + OpenStreetMap for maps
- Tailwind CSS v4
- lucide-react (icons)
- @fontsource/fraunces, @fontsource/inter (self-hosted fonts)

## Logo

The brand artwork lives in `app/assets/logo.png`. The site uses two files generated from it:

- `app/assets/logo-mark.png` — trimmed to the artwork with a transparent background (header, footer, admin sidebar via `components/layout/Logo.tsx`)
- `app/icon.png` — square browser-tab icon

After replacing `logo.png`, regenerate both:

```bash
node -e "const s=require('sharp');s('app/assets/logo.png').trim({threshold:20}).png().toBuffer().then(async b=>{await s(b).unflatten().resize({width:480}).png({compressionLevel:9,palette:true}).toFile('app/assets/logo-mark.png');await s(b).unflatten().resize({width:256,height:256,fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile('app/icon.png')})"
```
