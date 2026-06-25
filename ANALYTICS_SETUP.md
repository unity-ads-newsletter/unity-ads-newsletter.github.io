# Newsletter analytics — setup

Everything is wired in `index.html`. Tracking only turns on once you fill the
config values at the very top of that file (the `window.NEWSLETTER_*` block).
Until then nothing is sent — safe to ship.

## What gets tracked

| Question you asked            | How it's answered                                              |
|-------------------------------|---------------------------------------------------------------|
| How many people visit         | `page_view` event + a per-browser `visitor` id (unique count) |
| Where do they go in the page  | `section_view` — fires the first time each section is reached  |
| Where do they pause           | `section_dwell` — seconds spent in each section                |
| Session / scroll depth        | `scroll_depth` (25/50/75/100%) + furthest section reached      |
| How long did they spend       | `time_on_page` — total seconds, sent when they leave          |
| CTA / Subscribe interest      | `cta_talk_to_team`, `subscribe_open`, `subscribe`, `nav_click`, `glance_click` |
| Who/where the viewer is       | `visitor_info` + every row carries: `country`, `region`, `city`, `isp`, `ip`, `device`, `os`, `browser`, `lang`, `tz` |
| Subscriber identity (opt-in)  | `subscribe` row: email in `url`, plus `name` and `studio` columns |

> Location is approximate (IP-based, via ipwho.is — no key). Email/name/studio are
> only captured when a visitor enters them in the Subscribe popup; they can't be
> read silently. The Apps Script is schema-flexible: any new field becomes a new
> column automatically, so no future redeploys are needed.

## Subscribe

The footer **Subscribe** link opens a built-in popup; on submit, the email is
written to the Sheet as a `subscribe` event with the address in the **`url`**
column (no Google Form or extra setup needed). `subscribe_open` logs when the
popup is opened.

To use a Google Form instead, set `NEWSLETTER_SUBSCRIBE_URL` to the form's
`https://forms.gle/...` link — the popup is then bypassed and the link opens the
form (logged as `subscribe_click`).

## Option A (recommended, no third-party account) — log to your own Google Sheet

1. Open the Sheet: **Unity Ads Newsletter — Analytics Log**
   <https://docs.google.com/spreadsheets/d/17B_wN3EEFl0aUmvs1FxPBybXcPzi5esylgQ2JZsrOWs/edit>
2. **Extensions → Apps Script**, paste the contents of `analytics-backend.gs`, Save.
3. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone**. Deploy, authorize, copy the `/exec` URL.
4. Paste that URL into `NEWSLETTER_LOG_ENDPOINT` in `index.html`.

Every event becomes a row on the `events` tab. Build pivots/charts from there.

## Option B (optional add-on) — Microsoft Clarity for heatmaps + session recordings

Best for *visually* seeing where people pause, rage-click, and drop off.

1. <https://clarity.microsoft.com> → New project → copy the **Project ID**.
2. Paste it into `NEWSLETTER_CLARITY_ID` in `index.html`.

## Option C (optional add-on) — GA4

1. <https://analytics.google.com> → Admin → Data Streams → Web → copy the **Measurement ID** (`G-XXXXXXXXXX`).
2. Paste it into `NEWSLETTER_GA_ID` in `index.html`.

You can enable any combination — each is independent and off until its value is set.
