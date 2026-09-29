# Rotaract Club of Lilongwe — Member Management System

A member management system and public website for the Rotaract Club of Lilongwe (RAC), built with **SvelteKit** and **Supabase**. It manages the full member lifecycle and tracks club events and activities in one place.

---

## What this is

The system brings together a public-facing website and a private member/admin portal, so the club can:

- Receive and process membership applications online.
- Manage an up-to-date member directory, profiles, dues, and volunteer hours.
- Track events and activities — meetings, attendance, volunteer work, and project leads.
- Coordinate the End Polio campaign with a shared content calendar tracker.

---

## Key features

### Public website
- **Homepage, About, Projects, Partnerships, Donate** — club information and outreach pages.
- **Join** — a two-step membership application form.
- **Member Login** — members sign in with their assigned RAC number.
- **End Polio tracker** — a content calendar used to plan and track campaign posts.

### Member portal
- **Profile** — view and edit your own details.
- **Member directory** — searchable list of club members.
- **Dues** — track membership dues.
- **Attendance & volunteer hours** — record participation in club events.

### Admin panel
- **Applications** — review, approve, and reject membership applications; RAC numbers are assigned on approval.
- **Members** — manage member statuses and notes.
- **Activities** — log and manage club activities and events.
- **Attendance, dues, volunteer hours** — club-wide tracking.
- **Partnerships & donations** — manage incoming inquiries and donation interests.

---

## Access model

| Role | Access |
|------|--------|
| Visitor | Public pages, submit a join application, End Polio tracker |
| Member | Everything public, plus their own portal profile, the member directory, dues, attendance, and volunteer records |
| Admin | Everything above, plus the admin panel (applications, members, activities, attendance, dues, donations, partnerships, volunteer hours) |

---

## Core workflows

### Membership application
1. A visitor submits the join form.
2. An admin reviews it, changes the status, and approves it — assigning a RAC number and creating the member record.
3. The new member signs in at the login page and completes their profile.

### Events & activities
1. Club events and projects are logged in the activities module.
2. Attendance and volunteer hours are recorded against members.
3. Dues are tracked alongside member records for a full view of each member's involvement.

### End Polio campaign
- The calendar tracker plans weekly posts for each campaign month and tracks completion progress, synced so it persists across devices.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 |
| Database & Auth | Supabase |
| Styling | Custom design system (Svelte components + global CSS) |

## Android app build

The project includes a Capacitor Android wrapper and a static SvelteKit adapter for mobile builds.

```powershell
# Build and sync the Android app
npm run cap:android

# Build an Android APK
npm run cap:build:apk

# Open the native project in Android Studio
npm run cap:open:android
```

The release APK uses the deployed SvelteKit site by default because the portal uses server loads and actions for authentication and data changes. To use a different deployment:

```powershell
$env:CAPACITOR_SERVER_URL = 'https://rotaractlilongwe.com'
npm run cap:android
```

For shell-only local testing, explicitly use the bundled static files:

```powershell
$env:CAPACITOR_LOCAL_BUILD = 'true'
npm run cap:android
```

The local bundle does not support authenticated server actions.

The visual identity uses Playfair Display for headings, DM Sans for body text, and DM Mono for data — paired with the club's red, gold, and warm cream palette.
