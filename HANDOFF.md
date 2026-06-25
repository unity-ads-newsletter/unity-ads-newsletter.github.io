# CONTEXT: Unity Ads Newsletter — live site, integrations, sheet & tracking (handoff)

## THE SITE
- LIVE URL: https://unity-ads-newsletter.github.io
- GitHub repo: unity-ads-newsletter/unity-ads-newsletter.github.io  (branch: main)
- Deploy mechanism: push to `main` → GitHub Pages auto-builds (~1 min). THIS IS A LIVE SITE — verify before pushing, only change what's asked.
- Local clone: ~/Desktop/newsletter-projects/live-site/
- The page is ONE file: index.html (inline CSS + JS, no build step, no framework).
- Helper files in the repo (reference only, not served as pages):
  - analytics-backend.gs  (the Google Apps Script that powers tracking)
  - ANALYTICS_SETUP.md    (setup notes)

## CHANGES ALREADY LIVE (do not undo)
1. Footer: removed the "Manage preferences" link (and its tracking listener).
2. Footer: replaced "Unsubscribe" with "Subscribe" → opens a built-in popup
   (id `nlsub-overlay`) that collects email + name + studio and logs them.
3. CTA button "Talk to your Unity team" → https://unity.com/contact-us (opens new tab).
4. Full first-party analytics that logs every visitor to a Google Sheet (details below).

## TRACKING / INTEGRATIONS
Config block at the TOP of index.html (everything is OFF until its value is set, so it's safe):
- window.NEWSLETTER_GA_ID         = ""   // GA4 — optional, not set
- window.NEWSLETTER_CLARITY_ID    = ""   // Microsoft Clarity — optional, not set
- window.NEWSLETTER_SUBSCRIBE_URL = ""   // optional Google Form; blank = use built-in popup
- window.NEWSLETTER_LOG_ENDPOINT  = "https://script.google.com/macros/s/AKfycbyf3CRpnZVkn31qjDyF-rdHmgvtvFw4bhdFjHKld6N1esAE8BUVVqhKjvzfuG9ZWKiFTg/exec"   // ACTIVE tracking path

How tracking works:
- A JS IIFE near the bottom of index.html defines track() and sends a beacon (navigator.sendBeacon)
  for each event to NEWSLETTER_LOG_ENDPOINT (the Apps Script web app), which appends a row to the Sheet.
- GA4 + Clarity loaders are also wired in <head> but inactive until their IDs are filled in.

Events logged: page_view, visitor_info, section_view, section_dwell, scroll_depth, time_on_page,
engaged (15s OR 50% scroll OR click, once/session), cta_talk_to_team, subscribe_open, subscribe,
nav_click, glance_click, outbound_click.

Every beacon also carries: visitor ID + session ID, device/OS/browser/language/timezone,
approximate location (country/region/city/ISP/IP via a client-side fetch to https://ipwho.is, no key),
and campaign attribution (utm_source/medium/campaign/term/content + gclid + fbclid, read from the
landing URL and kept for the whole session).

## THE GOOGLE SHEET (data destination)
- Name: "Unity Ads Newsletter — Analytics Log"
- ID: 17B_wN3EEFl0aUmvs1FxPBybXcPzi5esylgQ2JZsrOWs
- URL: https://docs.google.com/spreadsheets/d/17B_wN3EEFl0aUmvs1FxPBybXcPzi5esylgQ2JZsrOWs/edit
- Tabs:
  - Sessions     → ONE row per visit (rolled up); the main human view
  - Column guide → explains every column + every event type
  - events       → raw event log (one row per action); source data
- Apps Script (bound to the Sheet): functions doPost, doGet, createColumnGuide, rebuildSessions, onOpen.
  - Web app deployed: "Execute as: Me", "Who has access: Anyone" (required — public site sends anonymous beacons).
  - Deployment ID: AKfycbyf3CRpnZVkn31qjDyF-rdHmgvtvFw4bhdFjHKld6N1esAE8BUVVqhKjvzfuG9ZWKiFTg (currently Version 4).
  - Backend is SCHEMA-FLEXIBLE: any new field sent from the page auto-creates a column. Headers are
    friendly names (Timestamp, Visitor ID, Country, Campaign source, etc.) via a LABELS map in the .gs.
  - "Sessions" tab is a snapshot: rebuild via Sheet menu Analytics → "Rebuild sessions summary"
    (or add a time-driven trigger on rebuildSessions for auto-refresh).

## RULES — DO NOT BREAK
- Edit ONLY ~/Desktop/newsletter-projects/live-site/index.html (the cloned repo file). Pull latest first.
- Do NOT remove/rename: the config block, the GA/Clarity loaders, the analytics IIFE / track(),
  the subscribe popup markup (#nlsub-overlay) and its handlers, or NEWSLETTER_LOG_ENDPOINT.
- After editing: verify locally, then  git add -A && git commit && git push origin main,
  then confirm the change is live at the URL.
- If you edit analytics-backend.gs, the user must re-paste it into the Apps Script editor and
  Deploy → Manage deployments → New version (same /exec URL is reused). The page does NOT need redeploying for that.

## OPEN / OPTIONAL (not blocking)
- Add Microsoft Clarity (paste a Project ID into NEWSLETTER_CLARITY_ID) for session recordings + heatmaps.
- Add GA4 (paste a G-XXXX ID into NEWSLETTER_GA_ID) if desired.
- Clear any leftover test rows in the events tab; delete a stray empty "Sheet1" tab if present.
- Privacy/legal: the site now collects location + emails/names — get Unity privacy sign-off before driving real traffic.

## WHAT I WANT YOU TO DO NOW
<write your new request here>
