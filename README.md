# Wordle Wars

**Attack of Tiles** is Kritika and Raj's two-person Wordle league. A playful dashboard for daily duels, lifelong bragging rights, and very questionable winning streaks.

React + TypeScript + Vite. No Google sign-in or accounts required.

## Run Locally

Use Node 20.17 or newer (Node 22 LTS recommended). From this repository:

```sh
npm ci
npm run dev
```

Open the URL Vite prints, normally http://localhost:5173. No database configuration is necessary to try the app.

```sh
npm test
npm run lint
npm run build
npm run preview
```

`lint` runs strict TypeScript checks. Tests cover scoring and execute the actual SQL schema in PGlite, including invite validation and cross-room isolation. No VS Code extensions are required. To debug, use VS Code's JavaScript Debug Terminal and run `npm run dev`.

## The League

- The first visit shows clearly labeled sample data. Start a fresh season or save a real duel to discard the samples.
- Enter both players' results from the official Wordle. The app does not scrape Wordle or include a Wordle clone.
- Fewer guesses wins. First solver breaks equal guesses. Two failures or simultaneous equal solves draw.
- Play the same puzzle, start together, and allow 15 minutes. Timing is on the honor system; late solves count as X.
- Click a match to edit or delete it. Match history has winner filters and JSON export.
- Light and neon dark themes remember your preference. Solved-only averages and guess distributions exclude X results.

Without shared storage, scores are saved only in this browser's localStorage. Clearing browser data loses those scores; export a backup first. Local data does not synchronize or automatically transfer to a new shared room. A new shared room starts empty. There is no JSON import yet.

## Shared Scores, No Sign-In

1. Create a Supabase project. In its SQL Editor, run `supabase/schema.sql` once on a fresh project.
2. Find the project URL and public **anon** API key in Supabase settings. Never use a service-role key in this app.
3. For local development, create `.env.local` in the repository root with these values:

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-KEY
```

4. Restart Vite. For hosting, set these same variables in Vercel and redeploy, since Vite embeds them at build time.
5. Select **Invite rival**, create a shared room, and send its private invite link to your friend. Both players must open that same link. Use the refresh icon to fetch the other player's latest updates.

Invites contain an unguessable 256-bit room capability in the URL fragment. Only its SHA-256 hash is stored in the database. RLS and revoked table privileges deny direct table access; checked database functions handle individual result writes. A unique puzzle/date per room prevents duplicate duels.

**Anyone with the invite link can read, edit, or delete room scores.** This is intentional for a trusted two-person project, not identity-based authorization. Keep the link private and bookmarked. There is no invite recovery, revocation UI, realtime subscription, or conflict-resolution UI; concurrent edits to the same result are last-write-wins. Export periodically.

Room creation is anonymous and has no application-level rate limiting. Before promoting the site widely, add server-side abuse controls or disable public room creation after provisioning your room. Public anon keys are not secrets, but room links are. Review free-plan limits and pause policies before choosing hosting plans.

## Publish To GitHub

A local Git repository is initialized. No commit, remote, or push has been made. Create an empty GitHub repository named `wordle-wars`, then run from this directory:

```sh
git add .
git commit -m "Build Wordle Wars dashboard"
git remote add origin https://github.com/YOUR-USERNAME/wordle-wars.git
git push -u origin main
```

Use GitHub's normal credential flow on your machine; never paste tokens into chat. Environment files are ignored. The SQL schema, lockfile, and tests belong in Git.

## Deploy To Vercel

1. Import your GitHub `wordle-wars` repository into Vercel. Its root should be this repository, not the parent workspace folder.
2. Select the **Vite** preset, build command `npm run build`, and output directory `dist`.
3. Use Node 22 LTS for the Vercel build. Add the Supabase environment variables above to enable shared scores.
4. Deploy, create your shared room on the hosted URL, and invite your friend.

Vercel Hobby and Supabase Free are suitable starting points for a small noncommercial project, subject to their current terms. Deploying without Supabase still works, but results remain browser-local.

Live GitHub publishing, a Vercel deployment, and a real Supabase connection require your accounts and are not provisioned by this repository. Local scoring, database isolation, and browser workflows have been tested; verify a save from one device appears on the other after configuring your live Supabase project.

This is an independent personal score tracker, not affiliated with The New York Times. Fonts load from Google Fonts; if unavailable, the app uses fallback fonts.
