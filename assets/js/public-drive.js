(() => {
  const panel = document.querySelector('[data-drive-folder]');
  if (!panel) return;

  const folderKey = panel.dataset.driveFolder;
  const config = window.STORAGE_CONFIG || {};
  const folderId = config.folders?.[folderKey];
  const apiKey = config.googleDriveApiKey;

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
      ? files.filter(file => file.name.toLowerCase().includes(keyword))
      : files;

    tbody.innerHTML = '';

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">표시할 자료가 없다.</td></tr>';
      return;
    }

    for (const file of filtered) {
      const tr = document.createElement('tr');
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
      const href = isFolder
        ? `https://drive.google.com/drive/folders/${file.id}`
        : `https://drive.google.com/uc?export=download&id=${file.id}`;

      tr.innerHTML = `
        <td class="file-name"><span class="file-icon">${iconFor(file.mimeType)}</span><span></span></td>
        <td>${isFolder ? '폴더' : formatBytes(file.size)}</td>
        <td>${formatDate(file.modifiedTime)}</td>
        <td><a class="download-link" href="${href}" target="_blank" rel="noopener">${isFolder ? '열기' : '다운로드'}</a></td>
      `;
      tr.querySelector('.file-name span:last-child').textContent = file.name;
      tbody.appendChild(tr);
    }
  };

  const load = async () => {
    if (!folderId) {
      setStatus('Google Drive 폴더 설정이 없다.', 'error');
      return;
    }

    if (!apiKey) {
      setStatus('Google Drive API 키 등록 대기 중', 'waiting');
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Google Cloud API 키를 등록하면 Drive 파일이 자동으로 표시된다.</td></tr>';
      return;
    }

    setStatus('자료를 불러오는 중…');

    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id,name,mimeType,size,modifiedTime)');
    const url = `https://www.googleapis.com/drive/v3/files?key=${encodeURIComponent(apiKey)}&q=${q}&fields=${fields}&orderBy=folder,name&pageSize=1000`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      files = Array.isArray(data.files) ? data.files : [];
      setStatus(`${files.length}개 자료`, 'ok');
      search.disabled = false;
      render();
    } catch (error) {
      console.error(error);
      setStatus('자료를 불러오지 못했다.', 'error');
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Google Drive 공개 설정과 API 키 제한 설정을 확인해야 한다.</td></tr>';
    }
  };

  search?.addEventListener('input', event => render(event.target.value));
  load();
})();
