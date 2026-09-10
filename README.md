# Sol — English Learning App (for Tamil speakers)

React + Vite app that:
- Shows **10 new English words a day**, each with its Tamil meaning and an example sentence, read aloud with a tap.
- Lets you **speak a sentence** and get it checked for grammar mistakes, with the corrected version read back to you.
- Uses a **Google Sheet as its database** (no backend, no server code).
- Builds to a **single HTML file**, so it deploys to Vercel as one static file.

---

## 1. How the "database" works

There's no traditional backend server. Instead, a small **Google Apps
Script** (`apps-script/Code.gs`) is bound to your Google Sheet and deployed
as a Web App. It reads/writes the Sheet directly, and the React app just
calls that Web App's URL — so your Sheet works like a lightweight database:

- `GET  ?action=words` → returns every row from the **Words** tab as JSON
- `POST { action: "logAttempt", ... }` → appends a row to the **Attempts**
  tab, so every sentence someone speaks and its correction gets saved

This also means the sheet can stay **private** (only shared with your own
Google account) — unlike the old "Publish to web as CSV" approach, nobody
needs public read access to your data.

### Set up your Google Sheet

1. Create a new Google Sheet.
2. In row 1 of the first tab, add these exact column headers, and rename
   the tab itself to **Words**:

   | id | english | tamil | example_en | example_ta |
   |----|---------|-------|------------|------------|

3. Fill in rows below with your words. A ready-made starter list of 30 words
   is included at `src/data/words.sample.csv` — open it and copy/paste the
   rows into your sheet (File → Import in Google Sheets works too).
4. You do **not** need to create an "Attempts" tab — the script creates it
   automatically the first time someone speaks a sentence.

### Deploy the Apps Script backend

1. In your Sheet, go to **Extensions → Apps Script**.
2. Delete the placeholder `myFunction() {}` code, then paste in the full
   contents of `apps-script/Code.gs` from this project.
3. Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" → choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, and authorize it when Google asks (it's your own
     script acting on your own sheet).
4. Copy the **Web app URL** — it ends in `/exec`. That's your
   `VITE_SHEETS_API_URL`.
5. Any time you edit `Code.gs` later, you must push a **new version**
   (Deploy → Manage deployments → pencil icon → New version) — editing the
   code alone doesn't update the live `/exec` URL.

---

## 2. Run it locally

```bash
npm install
cp .env.example .env
# paste your Apps Script Web app URL into .env as VITE_SHEETS_API_URL
npm run dev
```

Open the local URL it prints. Add or edit rows in your Google Sheet any
time — refresh the app to see the update (no redeploy needed for content
changes, since the sheet is fetched at runtime).

---

## 3. Build the single file

```bash
npm run build
```

This produces **`dist/index.html`** — one file containing all the JS and
CSS inlined, thanks to `vite-plugin-singlefile` in `vite.config.js`. You can
open that file directly in a browser, or deploy it as-is.

---

## 4. Deploy to Vercel

**Option A — Vercel CLI**

```bash
npm i -g vercel
vercel
```

When prompted, accept the defaults (Vercel auto-detects the Vite project).
Then add your environment variable so it's available at build time:

```bash
vercel env add VITE_SHEETS_API_URL
```

Paste your Apps Script Web app URL when prompted, then redeploy:

```bash
vercel --prod
```

**Option B — Vercel dashboard**

1. Push this project to a GitHub repo and import it in Vercel.
2. Framework preset: **Vite** (auto-detected).
3. Build command: `npm run build` — Output directory: `dist`.
4. In **Project Settings → Environment Variables**, add:
   `VITE_SHEETS_API_URL` = your Apps Script Web app URL.
5. Deploy.

> Important: `VITE_...` env vars are baked into the app **at build time**,
> not read at runtime. If you ever create a **new** Apps Script deployment
> (getting a new `/exec` URL), you need to update the env var and redeploy.
> Just editing rows in the Sheet, or pushing a new *version* of an existing
> deployment, needs no redeploy.

---

## 5. About the two features

**Daily 10 words** — picks a deterministic slice of your word list based on
the current date, so everyone sees the same 10 words on a given day, and it
rotates automatically tomorrow. No sign-in or write-back needed.

**Speak & Correct** — uses the browser's built-in Web Speech API to turn
your voice into text (works best in **Chrome or Edge**; desktop or
Android — Safari/iOS support is limited), then sends that text to the free
[LanguageTool API](https://languagetool.org/) to find grammar mistakes and
suggest corrections. This is a public rate-limited API — fine for personal
use. For heavier use you'd want your own LanguageTool key or a paid tier.

---

## Project structure

```
src/
  components/
    DailyWords.jsx     # word-of-the-day cards
    SpeakCorrect.jsx    # mic input + grammar correction
  lib/
    sheet.js            # fetch words & log attempts via the Apps Script API
    grammar.js           # LanguageTool API calls
  data/
    words.sample.csv    # starter word list to paste into your sheet
  App.jsx
  index.css
```
