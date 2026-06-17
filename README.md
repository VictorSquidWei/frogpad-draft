# 🐸 FrogPad Draft

A frog-themed League of Legends draft companion for the pad. Build per-role tier
lists, save your favourite team comps, log who counters who, then open **Draft
mode** and get live pick recommendations as the enemy team locks in.

The whole thing runs in the browser. By default your data lives in *your*
browser (no setup, no account). Flip on the optional Firebase sync and the whole
pad shares one board.

## What's inside

- **Top / JG / Mid / ADC / Support** — five independent S/A/B/C/D tier lists.
  Drag champions from the pool into a tier, or tap a champion then tap a tier.
- **Team comps** — save preset comps (one champ per role + an archetype + notes).
  The draft recommender biases toward completing your chosen comp.
- **Counter matchups** — record "pick beats enemy" with a strength rating and lane.
  This is the data the recommender reads to suggest counters.
- **Draft mode** — a live ally-vs-enemy board. Click a slot to focus it, enter
  enemy picks, and get a ranked list of recommended answers with the reasoning
  (counters, tier, comp fit) shown as chips.

Recommendations are only as good as what you feed in — the tool ranks champions
you've given it tier ratings, matchups, or comp slots for. The more you add, the
sharper draft mode gets.

## Run it locally

Requires Node 18+.

```bash
npm install
npm run dev      # start the dev server (prints a localhost URL)
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## Deploy to Vercel

This is a static Vite site, so deploying is quick:

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo.
3. Vercel auto-detects Vite. Build command `npm run build`, output `dist`.
4. Deploy.

Routing uses hash URLs (e.g. `/#/draft`), so no rewrite rules are needed and the
build also opens straight from disk for a quick look.

## Optional: shared data with Firebase

Skip this and everyone just has their own local board — totally fine for a side
project. To share one board across the pad:

1. Create a Firebase project and a **Cloud Firestore** database.
2. Copy `.env.example` to `.env` and fill in `VITE_FIREBASE_API_KEY`,
   `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` (and on Vercel, add the
   same as Environment Variables).
3. Redeploy. The sync badge in the top bar turns from **Local** to **Synced**.

All data is stored as a single document at `frogpad/{VITE_FIREBASE_DOC || "shared"}`.
For a private pad, lock Firestore rules to your group however you prefer.

## Backup / sharing without Firebase

The top-bar buttons export your whole board to a JSON file and import it back —
handy for backups or passing a starter board to a friend.

## Champion data

Champion names and icons come from Riot's public **Data Dragon** CDN at runtime,
so the roster stays current with patches automatically. A small bundled roster is
used as a fallback if the CDN can't be reached. Not affiliated with or endorsed
by Riot Games.

## Tech

React 18 + Vite, React Router (hash), hand-written CSS for the theme and
animations, optional Firebase Firestore. State lives in a small reducer store
with localStorage persistence.
