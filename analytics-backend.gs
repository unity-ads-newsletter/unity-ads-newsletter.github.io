/**
 * Unity Ads Newsletter — analytics logger (Google Apps Script), schema-flexible.
 * Receives event beacons from index.html and appends them to the "events" tab.
 * Any new field sent from the page automatically becomes a new column — so you
 * never have to redeploy this again when more data points are added.
 *
 * ONE-TIME SETUP / RE-DEPLOY
 * 1. Open the "Unity Ads Newsletter — Analytics Log" Sheet:
 *    https://docs.google.com/spreadsheets/d/17B_wN3EEFl0aUmvs1FxPBybXcPzi5esylgQ2JZsrOWs/edit
 * 2. Extensions -> Apps Script. Select all, delete, paste this whole file, Save.
 * 3. Deploy -> Manage deployments -> edit (pencil) -> Version: "New version" -> Deploy.
 *    (Keep "Execute as: Me" and "Who has access: Anyone". Same URL is reused.)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    if (!data.ts) { data.ts = new Date().toISOString(); }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('events') || ss.insertSheet('events');

    var headers;
    if (sheet.getLastRow() === 0) {
      headers = ['ts', 'event', 'visitor', 'session'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // Add a column for any field we haven't seen before
    var added = false;
    Object.keys(data).forEach(function(k){
      if (headers.indexOf(k) === -1) { headers.push(k); added = true; }
    });
    if (added) { sheet.getRange(1, 1, 1, headers.length).setValues([headers]); }

    var row = headers.map(function(h){ return data[h] !== undefined ? data[h] : ''; });
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
