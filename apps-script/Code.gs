const PUBLIC_FOLDERS = Object.freeze({
  poscam: '128bLkMAeMqDGfTWQa267_UfISoGbmUmJ',
  van: '1yBg9xZg1DwxR98kzX-EbWpyTf6HdOhEK',
  work: '1Kn2XpUyhrXVzE813AyzxW5E44WINdw6k'
});

function doGet(e) {
  const folderKey = String((e && e.parameter && e.parameter.folder) || '').toLowerCase();
  const callback = String((e && e.parameter && e.parameter.callback) || '');
  const payload = buildResponse_(folderKey);

  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
      return ContentService
        .createTextOutput('Invalid callback')
        .setMimeType(ContentService.MimeType.TEXT);
    }

    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildResponse_(folderKey) {
  const folderId = PUBLIC_FOLDERS[folderKey];

  if (!folderId) {
    return {
      ok: false,
      error: 'UNKNOWN_FOLDER',
      message: '허용되지 않은 자료실이다.'
    };
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'public-folder:' + folderKey;
  const cached = cache.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    const items = [];

    const folders = folder.getFolders();
    while (folders.hasNext()) {
      const child = folders.next();
      items.push({
        id: child.getId(),
        name: child.getName(),
        mimeType: 'application/vnd.google-apps.folder',
        size: null,
        modifiedTime: child.getLastUpdated().toISOString(),
        type: 'folder',
        openUrl: 'https://drive.google.com/drive/folders/' + child.getId(),
        downloadUrl: null
      });
    }

    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      const googleNative = mimeType.indexOf('application/vnd.google-apps.') === 0;

      items.push({
        id: file.getId(),
        name: file.getName(),
        mimeType: mimeType,
        size: googleNative ? null : file.getSize(),
        modifiedTime: file.getLastUpdated().toISOString(),
        type: 'file',
        openUrl: file.getUrl(),
        downloadUrl: googleNative
          ? null
          : 'https://drive.google.com/uc?export=download&id=' + file.getId()
      });
    }

    items.sort(function(a, b) {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'ko');
    });

    const response = {
      ok: true,
      folder: folderKey,
      updatedAt: new Date().toISOString(),
      count: items.length,
      items: items
    };

    cache.put(cacheKey, JSON.stringify(response), 60);
    return response;
  } catch (error) {
    return {
      ok: false,
      error: 'DRIVE_ERROR',
      message: error && error.message ? error.message : String(error)
    };
  }
}
