# HappyHouse — Technical Report

## 1. Project Overview

HappyHouse is a full-stack, database-driven property consultancy platform for a real-estate brokerage operating in Thane District, Maharashtra. It consists of a public marketing/listings site and an admin dashboard, backed by a shared MySQL database, so the business owner can manage all content — properties, areas, site settings, enquiries — without a developer's involvement after initial setup.

## 2. Problem Statement

Small property consultancies typically rely on either (a) a static website that requires a developer to update every listing, or (b) listing exclusively on third-party portals (99acres, MagicBricks, Housing.com) with no owned web presence, no control over branding, and no direct capture of enquiries. Neither gives the business a durable, owned channel for leads.

## 3. Proposed Solution

A self-hosted web application with a public site (search, browse, enquire) and an authenticated admin panel (manage listings, enquiries, areas, and business settings), where every piece of content the public sees is read from a database the owner controls directly through the UI.

## 4. Objectives

- The owner can publish a new property, with photos, without touching code.
- Enquiries submitted on the public site are captured and visible in the admin panel, not lost to a third-party portal's inbox.
- The site reflects real, current data only — no fabricated statistics, testimonials, or placeholder content presented as genuine.
- Reasonable performance, SEO, and accessibility without over-engineering for a small business's actual traffic scale.

## 5. Target Users

- **The business owner / consultant** (primary admin user) — manages listings and responds to enquiries, not necessarily technical.
- **Prospective buyers/renters** — browse, filter, and enquire about properties in Thane.
- **Property sellers/landlords** — contact the consultancy about listing their property (via the general contact form or WhatsApp).

## 6. Functional Requirements (implemented)

- Public: browse/search/filter/sort properties; view property detail with gallery, specs, amenities, map placeholder, similar properties, and portal-comparison links; submit enquiries (property-specific or general); browse areas served; light/dark theme toggle; save favorites and compare properties (browser-local, no login).
- Admin: authenticated login (JWT-in-cookie session); property CRUD with image upload (signed direct-to-Cloudinary); publish/feature/status toggles; CSV bulk import/export; enquiry management with status workflow; area management with photo upload; site-settings management; dashboard with real (non-fabricated) stats.

## 7. Non-Functional Requirements

- **Security**: bcrypt password hashing, JWT session cookies (httpOnly, sameSite=lax), rate limiting on login (5/min) and enquiry submission (10/hour) via `slowapi`, parameterized queries throughout (SQLAlchemy ORM — no raw string SQL), CORS restricted to the configured frontend origin, no secrets committed to the repo (`.env.example` templates only).
- **Performance**: images served through Cloudinary's CDN; site-settings/areas data cached for 60s at the fetch layer (these change rarely, and were previously re-queried from the DB on every single page load); property listing pages remain fully dynamic (never statically cached) since that data changes frequently and must reflect the database immediately after any admin action.
- **Availability**: single-server Docker Compose deployment (MySQL + FastAPI + Next.js) — no high-availability/multi-region design, appropriate for the target scale.

## 8. User Personas

- **Avinash (owner/consultant)** — runs the business, adds/updates listings, follows up on enquiries. Comfortable with basic web forms, not with code or databases directly.
- **Priya (buyer)** — searching for a 2BHK in a specific Thane locality within a budget; wants to filter quickly and compare a shortlist before contacting anyone.

## 9. User Journeys

**Property publication** (the core acceptance loop):
Admin logs in → Add property → fills form, uploads photos → checks Published → property appears on `/properties` and homepage (if Featured) immediately, no rebuild or redeploy.

**Enquiry loop**:
Visitor finds a property → submits enquiry (or messages via WhatsApp with a pre-filled, property-specific message) → enquiry appears in admin's Enquiries list, marked New → admin updates status as they follow up.

## 10. System Architecture

```
Public site (Next.js)  ─┐
                         ├──► REST API (FastAPI) ──► MySQL
Admin dashboard (Next.js)┘         │
                                    └──► Cloudinary (image storage, signed direct upload)
```

Frontend and backend are fully decoupled — the Next.js app never talks to MySQL directly, only through the FastAPI REST API. Server Components render on the Next.js server itself; inside Docker this required distinguishing the browser-facing API URL (`localhost:8000`, published host port) from the server-side API URL (`http://backend:8000`, Docker's internal network name) — see `SERVER_API_URL` in `docker-compose.yml` and the resolver in `frontend/lib/api.ts`.

## 11. Technology Selection

Next.js 14 (App Router) + TypeScript + Tailwind — chosen for the built-in server-rendering model that makes "always reflects the database" straightforward, and for a single deployable Node process. FastAPI + SQLAlchemy + Pydantic — chosen for fast iteration, automatic OpenAPI docs (`/docs`), and strong request/response validation. MySQL — specified in the original brief; InnoDB with foreign-key cascades for images/amenities.

## 12. Database Design

Seven core tables: `users`, `properties`, `property_images`, `property_amenities`, `enquiries`, `areas`, `site_settings` (single-row config table). Full DDL in `database/schema.sql`, seed/demo data (clearly `[DEMO]`-labeled) in `database/seed.sql`.

## 13. ER Diagram

See `docs/ER_DIAGRAM.md`.

## 14. API Architecture

REST, JSON, versioned implicitly by path (`/api/...`). Public endpoints (`/api/properties`, `/api/areas`, `/api/settings`, `POST /api/enquiries`) require no auth. Admin endpoints (`/api/admin/...`) require a valid session cookie, enforced via a FastAPI dependency (`get_current_user`), not per-route ad hoc checks. Full interactive documentation is auto-generated at `/docs` (Swagger UI) by FastAPI from the route definitions and Pydantic schemas — this is always in sync with the actual code, unlike a hand-maintained API reference.

## 15. Authentication & Security

Session-based auth via JWT stored in an httpOnly cookie (not localStorage, to reduce XSS exposure). Passwords hashed with bcrypt via `passlib`. Rate limiting on the two most abuse-prone unauthenticated endpoints (login, enquiry submission). CSRF protection via the double-submit cookie pattern: login sets a second, non-httpOnly cookie containing a random token; every mutating admin request (POST/PUT/PATCH/DELETE) must echo that token back in an `X-CSRF-Token` header, verified against the cookie server-side. A cross-site attacker's browser will auto-attach the session cookie but can't read its value to also produce a matching header. Admin password recovery: a self-service "change password" form for a logged-in admin who knows their current password, plus a CLI script (`scripts/reset_password.py`) for the fully-forgotten-password case — there's no email-based reset flow, since that would require SMTP infrastructure this project doesn't set up.

## 16. UI/UX Design System

See `docs/DESIGN_SYSTEM.md`.

## 17. Animation & Interaction Design

See "Motion principles" in `docs/DESIGN_SYSTEM.md`.

## 18. Property Management Workflow

Documented step-by-step in `docs/ADMIN_GUIDE.md`.

## 19. Enquiry Workflow

Documented in `docs/ADMIN_GUIDE.md`.

## 20. SEO Strategy

Per-page metadata (title/description), dynamic `sitemap.xml` (includes every published property, regenerated per request), `robots.txt` (disallows `/admin`), `schema.org/RealEstateListing` JSON-LD on property pages, Open Graph + Twitter Card metadata (property pages use the property's own primary photo; other pages fall back to the logo) so shared links render a proper preview card on WhatsApp/social platforms.

## 21. Performance Strategy

Next.js Image component for automatic responsive image sizing/lazy-loading; Cloudinary CDN for uploaded photos; 60-second cache on the rarely-changing settings/areas data (previously re-queried from the database on every single page load — this was found and fixed during the review pass that produced this report); database indexes on the common property search/filter columns (see `idx_properties_search` composite index and the FULLTEXT index in `schema.sql`).

## 22. Testing Strategy

30 automated backend tests (`pytest`, run against an in-memory SQLite database — see `backend/tests/`), covering: authentication (login success/failure, rate limiting, CSRF enforcement, password change), property CRUD (creation, slug-collision handling, publish/delete, location-privacy coordinate redaction), and enquiries (submission, rate limiting, admin status workflow, CSRF enforcement on mutation). Run with `pytest tests/ -v` from `backend/` after `pip install -r requirements-dev.txt`.

**This suite already found a real bug during development, not a hypothetical one**: `POST /api/admin/properties` and the property update endpoint returned the raw SQLAlchemy `amenities` relationship (a list of `PropertyAmenity` objects) against a response schema typed `List[str]` — this crashed with a 500 error any time an admin created or edited a property with amenities selected, on any database backend, not a test-only artifact. Fixed with a Pydantic field validator that normalizes either shape. This is a concrete example of why the earlier "no automated tests" gap mattered in practice, not just in principle.

No frontend automated tests exist yet (component tests, E2E). Frontend verification continues to be: TypeScript strict-mode compilation and a full production build (`next build`) after every significant change.

## 23. Test Cases

The primary acceptance test (matches the original brief's §45) was manually verified end-to-end: admin login → create property with images/amenities → publish → appears on public `/properties` and homepage → submit enquiry → appears in admin enquiries → change status to Sold → public listing reflects the status change with a "Sold" overlay rather than disappearing. The automated suite (§22) covers the same core flows at the API level, repeatably.

## 24. Deployment Architecture

Docker Compose (three services: `mysql`, `backend`, `frontend`) for one-command local/small-scale hosting — see the root `README.md` for exact commands. MySQL data persists in a named Docker volume. No CI/CD pipeline is configured; deployment is currently manual (`docker compose up --build`).

## 25. Future Improvements

In rough priority order: wider automated test coverage (areas, settings, image upload, and CSV import/export don't have dedicated tests yet — the current 30 focus on the highest-risk paths); a CI pipeline running the test suite on every change; email-based password reset (currently self-service change-password + a CLI recovery script only, no SMTP integration); multi-language (Marathi/Hindi) support for the public site; email notifications on new enquiries (currently dashboard/WhatsApp/phone only); production-grade image optimization pipeline (responsive `srcset` variants generated at upload time rather than relying solely on Cloudinary defaults).

## 26. Limitations

- Automated test coverage is real but partial — 30 tests on the highest-risk paths (auth, CSRF, core property/enquiry flows), not the full surface area.
- No CI pipeline — tests exist and pass but aren't run automatically on every change yet.
- No email-based password reset (self-service change-password and a CLI script cover the two practical cases; there's no "forgot password, get an email" flow).
- Comparison with 99acres/MagicBricks/Housing.com is limited to what's actually possible without those portals' paid API access: outbound comparison links and a manual CSV export — **not** a live sync, since no such public integration exists for any of the three.
- Single-server deployment; no horizontal scaling or CDN in front of the app itself (only uploaded images go through a CDN, via Cloudinary). Deliberately not over-built for this — a small local consultancy's traffic doesn't warrant multi-region infrastructure, and adding it now would be complexity without a corresponding need.

## 27. Conclusion

The platform meets its core objective: the business owner can add, edit, and publish real property listings — with photos, full details, and immediate public visibility — without developer involvement, and every enquiry submitted on the public site is captured for follow-up in one place. Security has real substance behind it (rate limiting, CSRF protection, hashed passwords, an automated test suite that has already caught one real bug), and the remaining gaps (§25–26) are honestly documented rather than glossed over.
