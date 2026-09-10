# Sol — English Learning App (for Tamil speakers)

React + Vite app that:
- Shows **10 new English words a day**, each with its Tamil meaning and an example sentence, read aloud with a tap.
- Lets you **speak a sentence** and get it checked for grammar mistakes, with the corrected version read back to you.
- Uses a **Google Sheet as its database** (no backend, no server code).
- Builds to a **single HTML file**, so it deploys to Vercel as one static file.

---

## 1. How the "database" works

There's no traditional backend. The app reads word data directly from a
Google Sheet that you **publish to the web as a CSV file**. This gives you a
free, publicly-readable JSON-like data source with zero server code.

> Note: because there's no backend, the app can't *write* progress back to
> the sheet. Word rotation is calculated automatically from the date instead
> (see step 4), so no write access is needed. If you later want to save
> user progress, you'd add a small backend (e.g. a Google Apps Script Web
> App) — happy to help with that as a next step.

### Set up your Google Sheet

1. Create a new Google Sheet.
2. In row 1, add these exact column headers:

   | id | english | tamil | example_en | example_ta |
   |----|---------|-------|------------|------------|

3. Fill in rows below with your words. A ready-made starter list of 30 words
   is included at `src/data/words.sample.csv` — open it and copy/paste the
   rows into your sheet (File → Import in Google Sheets works too).
4. Publish it to the web:
   - **File → Share → Publish to web**
   - Under "Link", choose the specific sheet/tab your words are on
   - Choose **Comma-separated values (.csv)** as the format
   - Click **Publish**, confirm, and copy the link it gives you

That link is your `VITE_SHEET_CSV_URL`.

---

## 2. Run it locally

```bash
npm install
cp .env.example .env
# paste your published CSV link into .env
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
vercel env add VITE_SHEET_CSV_URL
```

Paste your published CSV link when prompted, then redeploy:

```bash
vercel --prod
```

**Option B — Vercel dashboard**

1. Push this project to a GitHub repo and import it in Vercel.
2. Framework preset: **Vite** (auto-detected).
3. Build command: `npm run build` — Output directory: `dist`.
4. In **Project Settings → Environment Variables**, add:
   `VITE_SHEET_CSV_URL` = your published CSV link.
5. Deploy.

> Important: `VITE_...` env vars are baked into the app **at build time**,
> not read at runtime. If you change the sheet's *publish link* (not its
> content — just editing rows is fine), you need to redeploy.

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
    sheet.js            # fetch & parse the Google Sheet CSV
    grammar.js           # LanguageTool API calls
  data/
    words.sample.csv    # starter word list to paste into your sheet
  App.jsx
  index.css
```
