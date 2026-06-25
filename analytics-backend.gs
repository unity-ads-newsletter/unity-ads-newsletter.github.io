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
