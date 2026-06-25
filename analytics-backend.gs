/**
 * Unity Ads Newsletter — analytics logger (Google Apps Script), schema-flexible.
 * Receives event beacons from index.html and appends them to the "events" tab.
 * Column headers are the friendly LABELS below (not the raw field keys), so the
 * Sheet is readable by any team. Any new field auto-adds a column — no future
 * redeploys needed when more data points are added.
 *
 * RE-DEPLOY / SETUP
 * 1. Open the "Unity Ads Newsletter — Analytics Log" Sheet:
 *    https://docs.google.com/spreadsheets/d/17B_wN3EEFl0aUmvs1FxPBybXcPzi5esylgQ2JZsrOWs/edit
 * 2. IMPORTANT (first time only): clear the sheet — select all rows incl. the
 *    header row and delete — so clean, friendly headers get re-created.
 * 3. Extensions -> Apps Script. Select all, delete, paste this whole file, Save.
 * 4. Deploy -> Manage deployments -> edit (pencil) -> Version: "New version" -> Deploy.
 *    (Keep "Execute as: Me" and "Who has access: Anyone". Same URL is reused.)
 */

// Raw field key  ->  human-readable column header shown in the Sheet
var LABELS = {
  ts:            'Timestamp',
  event:         'Event',
  visitor:       'Visitor ID',
  session:       'Session ID',
  section:       'Section',
  percent:       'Scroll depth %',
  seconds:       'Duration (sec)',
  url:           'Email / link',
  path:          'Page path',
  ref:           'Referrer (came from)',
  w:             'Screen width',
  h:             'Screen height',
  lang:          'Language',
  tz:            'Timezone',
  os:            'Operating system',
  browser:       'Browser',
  device:        'Device type',
  ip:            'IP address',
  country:       'Country',
  country_code:  'Country code',
  region:        'Region / state',
  city:          'City',
  isp:           'ISP / network',
  name:          'Subscriber name',
  studio:        'Studio / company',
  utm_source:    'Campaign source',
  utm_medium:    'Campaign medium',
  utm_campaign:  'Campaign name',
  utm_term:      'Campaign term',
  utm_content:   'Campaign content',
  gclid:         'Google Ads click ID',
  fbclid:        'Meta click ID',
  reason:        'Engaged trigger'
};

// Preferred left-to-right column order (any unlisted fields are appended after)
var ORDER = ['ts','event','visitor','session','reason','section','percent','seconds',
  'name','studio','url','utm_source','utm_medium','utm_campaign','utm_term','utm_content',
  'gclid','fbclid','country','region','city','country_code','isp','ip','device','os',
  'browser','lang','tz','w','h','path','ref'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    if (!data.ts) { data.ts = new Date().toISOString(); }

    // Re-key the incoming data to friendly labels
    var labelled = {};
    Object.keys(data).forEach(function(k){ labelled[LABELS[k] || k] = data[k]; });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('events') || ss.insertSheet('events');

    var headers;
    if (sheet.getLastRow() === 0) {
      // Seed headers in the preferred order for whatever fields are present
      headers = [];
      ORDER.forEach(function(k){ var L = LABELS[k]; if (labelled.hasOwnProperty(L)) headers.push(L); });
      Object.keys(labelled).forEach(function(L){ if (headers.indexOf(L) === -1) headers.push(L); });
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    var added = false;
    Object.keys(labelled).forEach(function(L){
      if (headers.indexOf(L) === -1) { headers.push(L); added = true; }
    });
    if (added) { sheet.getRange(1, 1, 1, headers.length).setValues([headers]); }

    var row = headers.map(function(L){ return labelled[L] !== undefined ? labelled[L] : ''; });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doGet() {
  return ContentService.createTextOutput('Unity Ads Newsletter analytics endpoint is live.');
}

/**
 * Run this ONCE from the editor (Run -> createColumnGuide) to build a readable
 * "Column guide" tab explaining every column and event type. Safe to re-run.
 */
function createColumnGuide() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Column guide') || ss.insertSheet('Column guide');
  sh.clear();

  var rows = [
    ['COLUMN', 'WHAT IT MEANS'],
    ['Timestamp', 'Date & time the event happened (UTC, ISO 8601).'],
    ['Event', 'What happened on the page — see "EVENT TYPES" below.'],
    ['Visitor ID', 'Anonymous ID unique to each browser. Count distinct = unique people; repeats = returning visitors.'],
    ['Session ID', 'Anonymous ID for a single visit/sitting. Groups one person’s actions together.'],
    ['Engaged trigger', 'On "engaged" rows: what crossed the interest threshold (time_15s, scroll_50, or cta_click).'],
    ['Section', 'Which part of the page the row refers to (hero, glance, creatives, roas, cpe, dashboard, data, devtools, tapjoy, roadmap, cta).'],
    ['Scroll depth %', 'How far down the page the visitor scrolled (25 / 50 / 75 / 100).'],
    ['Duration (sec)', 'Seconds spent — in a section (section_dwell) or on the whole page (time_on_page).'],
    ['Subscriber name', 'Name typed into the Subscribe popup (opt-in only).'],
    ['Studio / company', 'Studio/company typed into the Subscribe popup (opt-in only).'],
    ['Email / link', 'Subscriber’s email address (on "subscribe" rows).'],
    ['Campaign source', 'utm_source from the landing URL — where the visit came from (e.g. linkedin, slack).'],
    ['Campaign medium', 'utm_medium — type of channel (e.g. social, email, cpc).'],
    ['Campaign name', 'utm_campaign — the campaign label (e.g. june_launch).'],
    ['Campaign term', 'utm_term — paid search keyword, if any.'],
    ['Campaign content', 'utm_content — which specific link/creative was clicked.'],
    ['Google Ads click ID', 'gclid — added automatically to clicks from Google Ads.'],
    ['Meta click ID', 'fbclid — added automatically to clicks from Facebook/Instagram.'],
    ['Country', 'Approximate country from the visitor’s IP.'],
    ['Region / state', 'Approximate region/state from IP.'],
    ['City', 'Approximate city from IP.'],
    ['Country code', 'Two-letter country code (e.g. IL, US).'],
    ['ISP / network', 'Internet provider / network name from IP.'],
    ['IP address', 'Visitor’s IP address (used for location; this is personal data).'],
    ['Device type', 'desktop or mobile.'],
    ['Operating system', 'Windows, macOS, iOS, Android, or Linux.'],
    ['Browser', 'Chrome, Safari, Firefox, Edge, etc.'],
    ['Language', 'Browser language (e.g. en-US).'],
    ['Timezone', 'Visitor’s timezone (e.g. America/Los_Angeles).'],
    ['Screen width', 'Browser viewport width in pixels.'],
    ['Screen height', 'Browser viewport height in pixels.'],
    ['Page path', 'Page URL path + hash.'],
    ['Referrer (came from)', 'The URL the visitor arrived from, if any.'],
    ['', ''],
    ['EVENT TYPES', 'WHAT THE ROW RECORDS'],
    ['page_view', 'A visitor opened the page (one per load).'],
    ['visitor_info', 'Full location + device snapshot, sent once location resolves.'],
    ['section_view', 'First time the visitor reached a given section (where they went).'],
    ['section_dwell', 'Seconds the visitor spent in a section (where they paused).'],
    ['scroll_depth', 'Reached a scroll milestone — 25 / 50 / 75 / 100%.'],
    ['time_on_page', 'Total seconds on the page (sent when they leave).'],
    ['engaged', 'Visitor showed real interest — 15s on page, 50% scroll, or a click. Once per session.'],
    ['cta_talk_to_team', 'Clicked "Talk to your Unity team".'],
    ['subscribe_open', 'Opened the Subscribe popup.'],
    ['subscribe', 'Submitted the Subscribe form (carries email / name / studio).'],
    ['nav_click', 'Used the side navigation.'],
    ['glance_click', 'Clicked an "At a glance" index item.'],
    ['outbound_click', 'Clicked an external reference link.']
  ];

  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(2, 640);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#7b2ff7').setFontColor('#ffffff');
  // bold the "EVENT TYPES" divider row
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'EVENT TYPES') {
      sh.getRange(i + 1, 1, 1, 2).setFontWeight('bold').setBackground('#f72f9e').setFontColor('#ffffff');
    }
  }
  sh.getRange(1, 1, rows.length, 2).setVerticalAlignment('middle').setWrap(true);
  return 'Column guide created';
}
