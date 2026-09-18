# SIT IEEE Photonics & ComSoc — Redesign

A from-scratch rebuild of [sitieeepandc.in](https://www.sitieeepandc.in/) with the same content
(events, timeline, team, member login) on a new design system, animations, and an admin
dashboard for updating content without touching code.

This is a **standalone local project** — nothing here talks to the old production site. It has
its own database and its own Cloudinary account once you configure them below.

## Stack

- **Next.js 16** (App Router, TypeScript) — frontend + API routes in one project
- **MongoDB** (via Mongoose) — events, upcoming events, members
- **Cloudinary** — image hosting (event photos, posters, member profile photos)
- **JWT + bcrypt** — member signup/login and a separate admin login, cookie-based sessions
- **Framer Motion** — page/section animations
- **Tailwind CSS v4** — styling, dark theme, Space Grotesk + Manrope fonts

## 1. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

- `MONGODB_URI` — a MongoDB Atlas free-tier cluster works fine. Create a database user and
  paste the connection string.
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — from your
  [Cloudinary dashboard](https://console.cloudinary.com/). You can reuse the club's existing
  account or create a new one — either works, this project doesn't assume which.
- `JWT_SECRET` — any long random string (e.g. `openssl rand -hex 32`).
- `ADMIN_PASSWORD` — the password you'll use to log in at `/admin`. Pick your own; don't reuse
  anything from the old site.

## 2. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 3. Seed the old content (optional, one-time)

`seed-data/` contains everything extracted from the original site:

- `events.json` — all 9 past events (2019–2025) with descriptions and photo URLs
- `members.json` — the current team roster (passwords were **not** and could not be extracted —
  see the note below)
- `images/` — a local backup copy of every image referenced above, in case you ever want to
  re-host them on a different Cloudinary account instead of the original URLs
- `logo.jpeg` → already copied to `public/logo.jpeg`

To load this into your database:

```bash
npm run seed
```

This is safe to re-run. It upserts events by name and members by USN, and never overwrites an
already-claimed member account.

### How member accounts migrate

The old site had no real signup — only a login form — so there are no passwords to bring over
(and its member list endpoint was, until you read this, publicly leaking password hashes; see
below). The seed script instead loads each roster member as an **unclaimed placeholder**: their
name, tag/post, photo, and links are pre-filled, but nobody can log in as them yet.

Each person activates their own account by going to **Member Login → Sign up** and entering the
same USN they had before. The signup flow recognizes the matching USN, attaches their new
email/password to that existing profile, and they immediately have their old photo and tag. From
there they can update their own profile photo and tag from `/member/dashboard`.

New members (with no prior USN on file) just sign up normally and start as `"Member"`; an admin
can change their tag afterward.

## 4. Admin dashboard

Go to `/admin/login`, enter `ADMIN_PASSWORD`, and you get a dashboard with three tabs:

- **Upcoming Events** — add/delete events with a poster image, date, location, description, and
  registration link. This is what powers `/upcoming-events`.
- **Timeline** — add/delete past events with multiple photos. This is what powers `/timeline`.
- **Members** — edit anyone's tag, promote/demote admins, delete accounts, or add a new roster
  placeholder for someone who hasn't signed up yet.

No code changes are needed to update events or the team roster going forward.

## Security note on the old site

While extracting this content, I found that the old site's public API
(`/api/members/members-by-year/4`) returns every member's bcrypt password hash with no
authentication required — anyone could pull the full list including hashed passwords. That data
was **not reused anywhere in this project** (the seed script only pulls name/USN/photo/tag/links,
never passwords). You should treat the old site's member passwords as compromised and get that
endpoint fixed or taken down independently of this rebuild.

## Project structure

```
src/
  app/            routes (pages + API routes)
  components/      shared UI (Navbar, Footer, admin panels, etc.)
  lib/             db connection, auth helpers, cloudinary, utils
  models/          Mongoose schemas (Member, Event, UpcomingEvent)
seed-data/         extracted content from the original site
```
