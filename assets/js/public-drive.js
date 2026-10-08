(() => {
  const panel = document.querySelector('[data-drive-folder]');
  if (!panel) return;

  const folderKey = panel.dataset.driveFolder;
  const config = window.STORAGE_CONFIG || {};
  const endpoint = String(config.publicDriveEndpoint || '').trim();
  const mappedFolder = config.folders?.[folderKey] || folderKey;

  const status = panel.querySelector('[data-drive-status]');
  const tbody = panel.querySelector('[data-drive-files]');
  const search = panel.querySelector('[data-drive-search]');

  const setStatus = (message, type = '') => {
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
  };

  const formatBytes = (value) => {
    const bytes = Number(value || 0);
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i += 1;
    }
    const digits = n >= 100 || i === 0 ? 0 : n >= 10 ? 1 : 2;
    return `${n.toFixed(digits)} ${units[i]}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(value));
  };

  const iconFor = (mimeType = '') => {
    if (mimeType === 'application/vnd.google-apps.folder') return '📁';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('msdownload') || mimeType.includes('octet-stream')) return '💾';
    if (mimeType.startsWith('text/')) return '📄';
    return '📄';
  };

  let files = [];

  const render = (query = '') => {
    const keyword = query.trim().toLowerCase();
    const filtered = keyword
      ? files.filter(file => String(file.name || '').toLowerCase().includes(keyword))
      : files;

    tbody.innerHTML = '';

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">표시할 자료가 없다.</td></tr>';
      return;
    }

    for (const file of filtered) {
      const tr = document.createElement('tr');
      const isFolder = file.type === 'folder' || file.mimeType === 'application/vnd.google-apps.folder';
      const href = isFolder ? file.openUrl : (file.downloadUrl || file.openUrl);
      const actionText = isFolder ? '열기' : (file.downloadUrl ? '다운로드' : '열기');

      tr.innerHTML = `
        <td class="file-name"><span class="file-icon">${iconFor(file.mimeType || '')}</span><span></span></td>
        <td>${isFolder ? '폴더' : formatBytes(file.size)}</td>
        <td>${formatDate(file.modifiedTime)}</td>
        <td><a class="download-link" href="${href}" target="_blank" rel="noopener">${actionText}</a></td>
      `;
      tr.querySelector('.file-name span:last-child').textContent = file.name || '';
      tbody.appendChild(tr);
    }
  };

  const loadJsonp = (url) => new Promise((resolve, reject) => {
    const callbackName = '__2bizDriveCallback_' + Date.now();
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => cleanup(new Error('TIMEOUT')), 15000);

    const cleanup = (error, data) => {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
      error ? reject(error) : resolve(data);
    };

    window[callbackName] = (data) => cleanup(null, data);
    script.onerror = () => cleanup(new Error('SCRIPT_LOAD_ERROR'));

    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${encodeURIComponent(callbackName)}`;
    document.head.appendChild(script);
  });

  const load = async () => {
    if (!endpoint) {
      setStatus('Apps Script 배포 URL 등록 대기 중', 'waiting');
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Apps Script 웹 앱을 배포한 뒤 URL을 등록하면 Drive 자료가 표시된다.</td></tr>';
      return;
    }

    setStatus('자료를 불러오는 중…');

    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${separator}folder=${encodeURIComponent(mappedFolder)}`;
      const data = await loadJsonp(url);

      if (!data || data.ok !== true) {
        throw new Error(data?.message || data?.error || 'UNKNOWN_RESPONSE');
      }

      files = Array.isArray(data.items) ? data.items : [];
      setStatus(`${files.length}개 자료`, 'ok');
      search.disabled = false;
      render();
    } catch (error) {
      console.error(error);
      setStatus('자료를 불러오지 못했다.', 'error');
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Apps Script 배포 권한과 URL 설정을 확인해야 한다.</td></tr>';
    }
  };

  search?.addEventListener('input', event => render(event.target.value));
  load();
})();
