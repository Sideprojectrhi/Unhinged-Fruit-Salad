# Unhinged Fruit Salad — Project Notes (v2)

A personal gift website for someone named **Rhiannon** (pronouns: **they/them** —
this is non-negotiable, see below). Static frontend + a Python serverless AI proxy.

**Note:** earlier work on this project (through the multi-page split and the
hamburger menu bug below) was done using GitHub Copilot in VS Code, not Claude
Code. Claude Code took over from that handoff point.

## Stack & deployment

- **Frontend:** split into three pages (see below), sharing `shared.css` / `shared.js`
- **Backend:** `api/fruit-salad.py`, a Vercel Python serverless function (stdlib only, no dependencies)
- **AI:** Google Gemini, model = `gemini-flash-latest` (an alias, not a dated snapshot — see gotchas below for why this matters)
- **Hosting:** Vercel, connected to GitHub repo `Unhinged-Fruit-Salad` on a separate account (`Sideprojectrhi`), intentionally not linked to the owner's main identity
- **Vercel Root Directory setting:** `Fruit Salad` (the actual project files are one level inside the repo, in a subfolder of that name)
- **Real production domain:** `unhinged-fruit-salad.vercel.app` — Vercel also generates per-deployment preview URLs with random suffixes (e.g. `unhinged-fruit-salad-o1tgc55wy-rhisideproject.vercel.app`); always test on the real domain, not a preview link, or you'll debug stale content
- **Env vars set in Vercel:** `GEMINI_API_KEY`

## Current file structure

```
Fruit Salad/
├── index.html      <- served at the domain root by Vercel; kept in sync with home.html
├── home.html        <- the empathetic home page experience
├── rant.html         <- sympathetic-only venting page, no fruits, Van Gogh on a sofa (placeholder art: reusing his 'staring' pose)
├── roast.html         <- pure roast/sass mode page
├── shared.css          <- all shared styling/animations/colors
├── shared.js            <- shared Fruit/Painter classes, game loop, CAST/VANGOGH data, hamburger menu code
├── assets/                <- character art (transparent PNGs) + starry-night-bg.png
└── api/
    └── fruit-salad.py      <- Gemini proxy, mode-aware (see below)
```

**`index.html` vs `home.html`:** Vercel serves `index.html` at the domain root.
`home.html` is the source of truth for that page's content — `index.html` should
be treated as a mirror/copy of it. These drifted out of sync once already (see
"Resolved: hamburger menu bug" below); if a future change to `home.html` doesn't
seem to show up live, check whether `index.html` was updated too.

## The three-page split

1. **Home** — Van Gogh reads intent and responds appropriately: sympathetic,
   roasting, or general-purpose depending on what fits. Not roast-only.
   `maxOutputTokens` = **2500**.
2. **Rant page** — Van Gogh purely sympathetic, no sass at all, dedicated
   venting space. `maxOutputTokens` = **4500**.
3. **Roast page** — Van Gogh pure sass/roast mode, no sympathy. Kept at the
   original **800** tokens (roasts should stay punchy).

Backend `build_system_prompt()` takes a `mode` param (`"home"`, `"rant"`,
`"roast"`) and picks personality + token budget accordingly.

## Critical: pronoun handling

Rhiannon uses **they/them**. All three modes' system prompts include a
prominent instruction (added right after the intro, not buried) telling the
model to never use she/her or he/him, always they/them or address them
directly by name/"you". **This must be preserved in any future prompt edits
— test after any system prompt change that pronoun handling still works
correctly on all three pages.**

## Personality / voice rules

- Default is sassy/bitchy/roasting on Home and Roast — not "sometimes," a
  permanent trait. Rant page is the one exception: purely sympathetic there.
- Word "love" avoided throughout.
- `HER_NAME` = "Rhiannon".
- Hardcoded `ROAST_LINES` array: used ~15% of the time on typed messages,
  ~50% of the time on quick-reply button taps (verify this logic survived
  the multi-page split intact — it may have drifted or gotten duplicated
  slightly differently per page during the refactor).
- All hardcoded personal content (greetings, roast lines, per-character
  idle/poke lines) lives in a clearly-marked block in `shared.js`.
- There was a request in progress to add an `APPROVED_LANGUAGE` word list to
  `api/fruit-salad.py` that the AI can naturally weave in — check whether
  this was actually implemented or is still pending.

## Feature: check-in modal (implemented)

Home page shows a gentle "hey, how are you doing?" pop-up ~15-20s after load,
once per session (sessionStorage-gated), with quick-reply buttons and a link
to the rant page. Styled to match the site aesthetic. Confirmed working.

## Resolved: hamburger menu bug (2026-07-23, commit `e1882c9`)

A hamburger menu (three horizontal lines) was added to link between
Home/Rant/Roast (bottom-right corner, matching the sound-toggle/chaos-meter
button style). It appeared broken across two earlier fix attempts:

1. First attempt: the button didn't exist in the rendered DOM at all.
2. Second attempt: changed init timing logic — didn't fix it. What appeared
   to work afterward was actually **Vercel's own developer toolbar** (an
   overlay Vercel injects for logged-in team members, invisible to real
   visitors) — a false positive, not the real fix.

**Actual root cause:** `Fruit Salad/index.html` — the file Vercel serves at
the domain root — was still the pre-split monolithic page (from before the
home/rant/roast three-page split) and never referenced `shared.js` or
`shared.css` at all. No amount of fixing the menu code in `shared.js` could
ever show up on the live root page while that stayed true.

**Fix:** replaced `index.html` with the current `home.html` content (byte-copy,
not retyped). Also cleaned up a duplicate `initHamburgerMenu()` function
definition in `shared.js`, and replaced the raw pasted hamburger Unicode
character with its JS unicode escape sequence so it can't be mangled by
encoding round-trips again.

**Verified live** on `unhinged-fruit-salad.vercel.app` after deploy: root page
now loads `shared.js`/`shared.css` and the check-in modal; live `shared.js` is
byte-identical to the fixed source (one `initHamburgerMenu` definition, escaped
character, passes `node --check`); `#navMenuBtn` CSS (`position:fixed;
bottom:12px; right:12px`) is live; `rant.html` and `roast.html` both return
200 and load `shared.js`/`shared.css`. Not independently confirmed: the actual
rendered DOM/Elements-tab view in a live browser, since no browser/DevTools
tool was available to do that check directly — the above was the closest
available verification.

## Other known gotchas

- Any string with an apostrophe needs backticks, not straight quotes, in the
  JS arrays — a missing/mismatched backtick once caused a full site outage
  by silently swallowing a large chunk of the script.
- Never hardcode a dated Gemini model name (`gemini-2.5-flash`,
  `gemini-2.5-flash-lite` — both got retired for new API keys even though
  they still appeared in the model list). Stick with the `gemini-flash-latest`
  alias.
- Gemini free tier: Flash-tier is roughly 1,500 requests/day, Pro is only
  about 50/day — this is why all three modes deliberately stay on Flash, not
  Pro.
- The Python proxy always returns HTTP 200 with `{"reply": null, "error":
  "..."}` on failure rather than a hard error, so the frontend's
  `FALLBACK_LINES` pool kicks in seamlessly. Don't "fix" this into throwing
  real HTTP errors — it's intentional.
- Character PNGs can come out of AI generators with checkerboard patterns
  baked into the actual pixels (not real alpha transparency) — always verify
  RGBA mode before using new art assets.
- Raw pasted Unicode characters in JS string literals are risky in this repo
  (Windows/PowerShell tool round-trips have mangled them before) — prefer JS
  unicode escapes, and verify with actual character codes, not just visual
  inspection, if a fix touches one.

## Not yet built

Automated daily email from Van Gogh (decided against push notifications for
security/reliability reasons). Not started yet. If/when this comes up: email
only (not push/SMS), her address in an env var never in code, a shared-secret
check on the trigger endpoint so random people can't spam it, Resend as the
suggested email API provider.
