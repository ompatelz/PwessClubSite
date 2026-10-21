// Deploy this web app from the pressclub@dau.ac.in Google account.
// Execute as: Me. Who has access: Anyone. Keep its URL and secret on the server.

var NNN_SUBJECT = 'News and Nonsense — August 2026, Part 1';
var NNN_FILENAME = 'NNN-August-2026-Part-1.pdf';
var NNN_PDF_SHA256 = 'f6df66edeb6010ce0c2f50592a2935ab7b224b95007399f2b5879aa0ba9cef13';

function initializeSecret() {
  var properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('NNN_GMAIL_SCRIPT_SECRET')) {
    properties.setProperty('NNN_GMAIL_SCRIPT_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
}

function authorize() {
  // Run this once in the editor while signed in as the Press Club account.
  GmailApp.getAliases();
}

function reply_(result) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function sha256_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
    .map(function (byte) { return ('0' + (byte & 255).toString(16)).slice(-2); })
    .join('');
}

function doPost(event) {
  var email = '';
  var cache;
  var cacheKey;
  try {
    var input = JSON.parse(event.postData.contents);
    var expectedSecret = PropertiesService.getScriptProperties().getProperty('NNN_GMAIL_SCRIPT_SECRET');
    if (!expectedSecret || input.secret !== expectedSecret) return reply_({ ok: false, error: 'unauthorized' });

    if (Session.getEffectiveUser().getEmail().toLowerCase() !== 'pressclub@dau.ac.in') {
      return reply_({ ok: false, error: 'wrong_sender_account' });
    }

    email = String(input.email || '').trim().toLowerCase();
    if (email.length > 254 || !/^[a-z0-9._%+-]+@dau\.ac\.in$/.test(email)) {
      return reply_({ ok: false, error: 'invalid_recipient' });
    }

    var encoded = String(input.pdfBase64 || '');
    if (encoded.length > 2000000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      return reply_({ ok: false, error: 'invalid_attachment' });
    }
    var bytes = Utilities.base64Decode(encoded);
    if (sha256_(bytes) !== NNN_PDF_SHA256) {
      return reply_({ ok: false, error: 'wrong_issue' });
    }

    cache = CacheService.getScriptCache();
    cacheKey = 'nnn:' + email;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(1000)) return reply_({ ok: false, error: 'busy' });
    try {
      if (cache.get(cacheKey)) return reply_({ ok: false, error: 'recent_request' });
      cache.put(cacheKey, '1', 300);
    } finally {
      lock.releaseLock();
    }

    var attachment = Utilities.newBlob(bytes, MimeType.PDF, NNN_FILENAME);
    GmailApp.sendEmail(
      email,
      NNN_SUBJECT,
      'Here is your copy of News and Nonsense, August 2026 Part 1.\n\nThe Press Club at DAU',
      { attachments: [attachment], name: 'The Press Club' }
    );
    return reply_({ ok: true });
  } catch (error) {
    if (cache && cacheKey) cache.remove(cacheKey);
    console.error('NNN send failed: ' + error);
    return reply_({ ok: false, error: 'send_failed' });
  }
}
