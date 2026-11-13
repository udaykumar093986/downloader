document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // Elements
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const fetchBtn = document.getElementById('fetchBtn');
  const fetchBtnText = document.getElementById('fetchBtnText');
  const fetchBtnIcon = document.getElementById('fetchBtnIcon');

  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const errorActionSection = document.getElementById('errorActionSection');
  const openProxyFromErrorBtn = document.getElementById('openProxyFromErrorBtn');

  const toggleProxyBtn = document.getElementById('toggleProxyBtn');
  const proxyPanel = document.getElementById('proxyPanel');
  const proxyChevron = document.getElementById('proxyChevron');
  const proxyStatusLabel = document.getElementById('proxyStatusLabel');
  const proxyInput = document.getElementById('proxyInput');
  const saveProxyBtn = document.getElementById('saveProxyBtn');
  const clearProxyBtn = document.getElementById('clearProxyBtn');

  const mediaCard = document.getElementById('mediaCard');
  const mediaThumbnail = document.getElementById('mediaThumbnail');
  const mediaDuration = document.getElementById('mediaDuration');
  const mediaTitle = document.getElementById('mediaTitle');
  const mediaAuthor = document.getElementById('mediaAuthor');
  const mediaPlatform = document.getElementById('mediaPlatform');

  const tabVideo = document.getElementById('tabVideo');
  const tabAudio = document.getElementById('tabAudio');
  const videoFormatsContainer = document.getElementById('videoFormatsContainer');
  const audioFormatsContainer = document.getElementById('audioFormatsContainer');

  const progressSection = document.getElementById('progressSection');
  const progressStatusText = document.getElementById('progressStatusText');
  const progressSpeed = document.getElementById('progressSpeed');
  const progressEta = document.getElementById('progressEta');
  const progressBar = document.getElementById('progressBar');
  const progressSize = document.getElementById('progressSize');
  const progressPercent = document.getElementById('progressPercent');

  const completedAlert = document.getElementById('completedAlert');
  const completedFileName = document.getElementById('completedFileName');
  const saveFileBtn = document.getElementById('saveFileBtn');

  const openFolderBtn = document.getElementById('openFolderBtn');
  const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
  const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
  const historyList = document.getElementById('historyList');
  const historyBadge = document.getElementById('historyBadge');

  const openMobileModalBtn = document.getElementById('openMobileModalBtn');
  const mobileModal = document.getElementById('mobileModal');
  const closeMobileModalBtn = document.getElementById('closeMobileModalBtn');
  const qrcodeContainer = document.getElementById('qrcode');
  const mobileUrlDisplay = document.getElementById('mobileUrlDisplay');
  const copyMobileUrlBtn = document.getElementById('copyMobileUrlBtn');

  // Preview & Privacy Elements
  const hidePreviewCheckbox = document.getElementById('hidePreviewCheckbox');
  const thumbnailOverlay = document.getElementById('thumbnailOverlay');
  const toggleThumbnailBtn = document.getElementById('toggleThumbnailBtn');
  const toggleThumbnailIcon = document.getElementById('toggleThumbnailIcon');
  const unhideBtn = document.getElementById('unhideBtn');

  // URL Password Masking Elements
  const toggleUrlMaskBtn = document.getElementById('toggleUrlMaskBtn');
  const urlMaskIcon = document.getElementById('urlMaskIcon');
  const maskUrlCheckbox = document.getElementById('maskUrlCheckbox');

  // Website Passcode Lock Elements
  const lockScreenModal = document.getElementById('lockScreenModal');
  const unlockForm = document.getElementById('unlockForm');
  const unlockPasscodeInput = document.getElementById('unlockPasscodeInput');
  const unlockErrorMsg = document.getElementById('unlockErrorMsg');

  const lockSettingsBtn = document.getElementById('lockSettingsBtn');
  const lockSettingsLabel = document.getElementById('lockSettingsLabel');
  const lockSettingsIcon = document.getElementById('lockSettingsIcon');
  const passcodeConfigModal = document.getElementById('passcodeConfigModal');
  const closePasscodeModalBtn = document.getElementById('closePasscodeModalBtn');
  const newPasscodeInput = document.getElementById('newPasscodeInput');
  const passcodeStatusNote = document.getElementById('passcodeStatusNote');
  const savePasscodeBtn = document.getElementById('savePasscodeBtn');
  const removePasscodeBtn = document.getElementById('removePasscodeBtn');

  // In-App Webpage Viewer Elements
  const toggleWebviewBtn = document.getElementById('toggleWebviewBtn');
  const webviewBtnText = document.getElementById('webviewBtnText');
  const webviewContainer = document.getElementById('webviewContainer');
  const webviewUrlLabel = document.getElementById('webviewUrlLabel');
  const reloadWebviewBtn = document.getElementById('reloadWebviewBtn');
  const externalWebviewLink = document.getElementById('externalWebviewLink');
  const closeWebviewBtn = document.getElementById('closeWebviewBtn');
  const webviewLoading = document.getElementById('webviewLoading');
  const webviewIframe = document.getElementById('webviewIframe');

  let qrCodeInstance = null;
  let cachedMobileUrl = '';

  let currentVideoInfo = null;
  let activeEventSource = null;

  // Manage Proxy Settings
  let activeProxy = localStorage.getItem('omni_proxy') || '';
  if (activeProxy) {
    proxyInput.value = activeProxy;
    updateProxyUI(activeProxy);
  }

  function updateProxyUI(proxy) {
    if (proxy && proxy.trim()) {
      proxyStatusLabel.textContent = `Proxy Active (${proxy.trim()})`;
      proxyStatusLabel.classList.add('text-indigo-400');
    } else {
      proxyStatusLabel.textContent = 'Proxy Settings (Direct / No Proxy)';
      proxyStatusLabel.classList.remove('text-indigo-400');
    }
  }

  toggleProxyBtn.addEventListener('click', () => {
    const isHidden = proxyPanel.classList.toggle('hidden');
    proxyChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
  });

  saveProxyBtn.addEventListener('click', () => {
    const val = proxyInput.value.trim();
    if (val) {
      activeProxy = val;
      localStorage.setItem('omni_proxy', val);
    } else {
      activeProxy = '';
      localStorage.removeItem('omni_proxy');
    }
    updateProxyUI(activeProxy);
    proxyPanel.classList.add('hidden');
    proxyChevron.style.transform = 'rotate(0deg)';
  });

  clearProxyBtn.addEventListener('click', () => {
    activeProxy = '';
    proxyInput.value = '';
    localStorage.removeItem('omni_proxy');
    updateProxyUI('');
    proxyPanel.classList.add('hidden');
    proxyChevron.style.transform = 'rotate(0deg)';
  });

  if (openProxyFromErrorBtn) {
    openProxyFromErrorBtn.addEventListener('click', () => {
      proxyPanel.classList.remove('hidden');
      proxyChevron.style.transform = 'rotate(180deg)';
      proxyInput.focus();
      proxyPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // Manage URL Password-Masking Mode (••••••)
  let isUrlMasked = localStorage.getItem('omni_mask_url') !== 'false'; // default to true

  function applyUrlMask(masked) {
    isUrlMasked = masked;
    urlInput.type = masked ? 'password' : 'text';
    if (maskUrlCheckbox) maskUrlCheckbox.checked = masked;
    if (urlMaskIcon) {
      urlMaskIcon.setAttribute('data-lucide', masked ? 'eye' : 'eye-off');
    }
    if (toggleUrlMaskBtn) {
      toggleUrlMaskBtn.setAttribute('title', masked ? 'Show URL (Reveal)' : 'Mask URL as Password');
    }
    lucide.createIcons();
  }

  applyUrlMask(isUrlMasked);

  if (toggleUrlMaskBtn) {
    toggleUrlMaskBtn.addEventListener('click', (e) => {
      e.preventDefault();
      applyUrlMask(!isUrlMasked);
    });
  }

  if (maskUrlCheckbox) {
    maskUrlCheckbox.addEventListener('change', () => {
      const checked = maskUrlCheckbox.checked;
      localStorage.setItem('omni_mask_url', checked ? 'true' : 'false');
      applyUrlMask(checked);
    });
  }

  // Manage Website Passcode / PIN Protection
  function checkWebsitePasscode() {
    const savedCode = localStorage.getItem('omni_passcode');
    if (savedCode) {
      const unlocked = sessionStorage.getItem('omni_unlocked') === 'true';
      if (!unlocked) {
        lockScreenModal.classList.remove('hidden');
        setTimeout(() => unlockPasscodeInput.focus(), 150);
      } else {
        lockScreenModal.classList.add('hidden');
      }
      if (lockSettingsLabel) lockSettingsLabel.textContent = 'PIN Active';
      if (lockSettingsIcon) lockSettingsIcon.classList.add('text-emerald-400');
    } else {
      lockScreenModal.classList.add('hidden');
      if (lockSettingsLabel) lockSettingsLabel.textContent = 'Passcode';
      if (lockSettingsIcon) lockSettingsIcon.classList.remove('text-emerald-400');
    }
  }

  if (unlockForm) {
    unlockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = unlockPasscodeInput.value.trim();
      const savedCode = localStorage.getItem('omni_passcode');
      if (entered === savedCode) {
        sessionStorage.setItem('omni_unlocked', 'true');
        lockScreenModal.classList.add('hidden');
        unlockErrorMsg.classList.add('hidden');
        unlockPasscodeInput.value = '';
      } else {
        unlockErrorMsg.textContent = 'Incorrect passcode. Please try again.';
        unlockErrorMsg.classList.remove('hidden');
        unlockPasscodeInput.focus();
        unlockPasscodeInput.select();
      }
    });
  }

  function updatePasscodeModalUI() {
    const savedCode = localStorage.getItem('omni_passcode');
    if (savedCode) {
      passcodeStatusNote.innerHTML = '<span class="text-emerald-400 font-semibold">● Passcode currently active.</span> Anyone visiting this website must enter this code to use it.';
      removePasscodeBtn.classList.remove('hidden');
    } else {
      passcodeStatusNote.textContent = 'No passcode is set. Anyone with your website link can use the downloader.';
      removePasscodeBtn.classList.add('hidden');
    }
    newPasscodeInput.value = '';
  }

  if (lockSettingsBtn) {
    lockSettingsBtn.addEventListener('click', () => {
      updatePasscodeModalUI();
      passcodeConfigModal.classList.remove('hidden');
      setTimeout(() => newPasscodeInput.focus(), 100);
    });
  }

  if (closePasscodeModalBtn) {
    closePasscodeModalBtn.addEventListener('click', () => {
      passcodeConfigModal.classList.add('hidden');
    });
  }

  if (passcodeConfigModal) {
    passcodeConfigModal.addEventListener('click', (e) => {
      if (e.target === passcodeConfigModal) {
        passcodeConfigModal.classList.add('hidden');
      }
    });
  }

  if (savePasscodeBtn) {
    savePasscodeBtn.addEventListener('click', () => {
      const code = newPasscodeInput.value.trim();
      if (!code) {
        alert('Please enter a passcode or PIN.');
        return;
      }
      localStorage.setItem('omni_passcode', code);
      sessionStorage.setItem('omni_unlocked', 'true');
      passcodeConfigModal.classList.add('hidden');
      checkWebsitePasscode();
      alert('Passcode set successfully! This website will now require this code to enter.');
    });
  }

  if (removePasscodeBtn) {
    removePasscodeBtn.addEventListener('click', () => {
      if (confirm('Remove passcode protection? Anyone will be able to access the site without entering a PIN.')) {
        localStorage.removeItem('omni_passcode');
        sessionStorage.removeItem('omni_unlocked');
        passcodeConfigModal.classList.add('hidden');
        checkWebsitePasscode();
      }
    });
  }

  checkWebsitePasscode();

  // Manage Preview Visibility & Discrete Mode
  let isPreviewHidden = localStorage.getItem('omni_hide_preview') === 'true';
  if (hidePreviewCheckbox) {
    hidePreviewCheckbox.checked = isPreviewHidden;
    hidePreviewCheckbox.addEventListener('change', () => {
      isPreviewHidden = hidePreviewCheckbox.checked;
      localStorage.setItem('omni_hide_preview', isPreviewHidden);
      applyPreviewVisibility(isPreviewHidden);
    });
  }

  function applyPreviewVisibility(hidden) {
    if (!thumbnailOverlay) return;
    if (hidden) {
      thumbnailOverlay.classList.remove('hidden');
      mediaThumbnail.classList.add('blur-lg', 'scale-105', 'opacity-30');
      if (toggleThumbnailIcon) {
        toggleThumbnailIcon.setAttribute('data-lucide', 'eye');
      }
      if (toggleThumbnailBtn) {
        toggleThumbnailBtn.setAttribute('title', 'Show preview');
      }
    } else {
      thumbnailOverlay.classList.add('hidden');
      mediaThumbnail.classList.remove('blur-lg', 'scale-105', 'opacity-30');
      if (toggleThumbnailIcon) {
        toggleThumbnailIcon.setAttribute('data-lucide', 'eye-off');
      }
      if (toggleThumbnailBtn) {
        toggleThumbnailBtn.setAttribute('title', 'Hide preview');
      }
    }
    lucide.createIcons();
  }

  if (toggleThumbnailBtn) {
    toggleThumbnailBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentlyHidden = !thumbnailOverlay.classList.contains('hidden');
      applyPreviewVisibility(!currentlyHidden);
    });
  }

  if (unhideBtn) {
    unhideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyPreviewVisibility(false);
    });
  }

  function resetPreview() {
    mediaCard.classList.add('hidden');
    progressSection.classList.add('hidden');
    completedAlert.classList.add('hidden');
    hideWebview();
    hideError();
  }

  function hideWebview() {
    if (!webviewContainer) return;
    webviewContainer.classList.add('hidden');
    if (webviewBtnText) webviewBtnText.textContent = 'Show Webpage';
    if (webviewIframe) webviewIframe.src = 'about:blank';
  }

  function loadWebview(url) {
    if (!url) return;
    webviewContainer.classList.remove('hidden');
    if (webviewBtnText) webviewBtnText.textContent = 'Hide Webpage';
    if (externalWebviewLink) externalWebviewLink.href = url;
    if (webviewUrlLabel) {
      webviewUrlLabel.textContent = isUrlMasked ? '••••••••••••••••••••••••' : url;
    }
    if (webviewLoading) webviewLoading.classList.remove('hidden');
    if (webviewIframe) {
      webviewIframe.src = `/api/proxy-page?url=${encodeURIComponent(url)}`;
      webviewIframe.onload = () => {
        if (webviewLoading) webviewLoading.classList.add('hidden');
      };
    }
    webviewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (toggleWebviewBtn) {
    toggleWebviewBtn.addEventListener('click', () => {
      const isHidden = webviewContainer.classList.contains('hidden');
      if (isHidden) {
        if (currentVideoInfo && currentVideoInfo.webpage_url) {
          loadWebview(currentVideoInfo.webpage_url);
        }
      } else {
        hideWebview();
      }
    });
  }

  if (closeWebviewBtn) {
    closeWebviewBtn.addEventListener('click', hideWebview);
  }

  if (reloadWebviewBtn) {
    reloadWebviewBtn.addEventListener('click', () => {
      if (currentVideoInfo && currentVideoInfo.webpage_url) {
        loadWebview(currentVideoInfo.webpage_url);
      }
    });
  }

  // Hide previous preview immediately once a link is pasted or modified
  urlInput.addEventListener('input', () => {
    if (!mediaCard.classList.contains('hidden')) {
      resetPreview();
    }
  });

  urlInput.addEventListener('paste', () => {
    setTimeout(resetPreview, 0);
  });

  // Paste from clipboard helper
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        resetPreview();
        urlInput.focus();
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  });

  // Tab switching
  tabVideo.addEventListener('click', () => {
    tabVideo.classList.add('active');
    tabAudio.classList.remove('active');
    videoFormatsContainer.classList.remove('hidden');
    audioFormatsContainer.classList.add('hidden');
  });

  tabAudio.addEventListener('click', () => {
    tabAudio.classList.add('active');
    tabVideo.classList.remove('active');
    audioFormatsContainer.classList.remove('hidden');
    videoFormatsContainer.classList.add('hidden');
  });

  function showError(msg) {
    let displayMsg = msg;
    if (isUrlMasked && typeof displayMsg === 'string') {
      displayMsg = displayMsg.replace(/https?:\/\/[^\s"'<>]+/gi, '••••••••••••');
    }
    errorMessage.textContent = displayMsg;
    errorAlert.classList.remove('hidden');
    if (
      msg.includes('ISP') ||
      msg.includes('10054') ||
      msg.includes('Proxy') ||
      msg.includes('VPN') ||
      msg.includes('firewall')
    ) {
      errorActionSection.classList.remove('hidden');
    } else {
      errorActionSection.classList.add('hidden');
    }
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    errorAlert.classList.add('hidden');
    if (errorActionSection) errorActionSection.classList.add('hidden');
  }

  function setFetchLoading(loading) {
    if (loading) {
      fetchBtn.disabled = true;
      fetchBtnText.textContent = 'Inspecting...';
      fetchBtnIcon.setAttribute('data-lucide', 'loader-2');
      fetchBtnIcon.classList.add('animate-spin');
    } else {
      fetchBtn.disabled = false;
      fetchBtnText.textContent = 'Inspect Link';
      fetchBtnIcon.setAttribute('data-lucide', 'arrow-right');
      fetchBtnIcon.classList.remove('animate-spin');
    }
    lucide.createIcons();
  }

  // Handle URL Form Submit (Inspect link)
  urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    hideError();
    mediaCard.classList.add('hidden');
    progressSection.classList.add('hidden');
    completedAlert.classList.add('hidden');
    setFetchLoading(true);

    try {
      const resp = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          proxy: activeProxy || undefined,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || 'Could not fetch media information.');
      }

      currentVideoInfo = data;
      renderMediaInfo(data);
    } catch (err) {
      showError(err.message);
    } finally {
      setFetchLoading(false);
    }
  });

  function renderMediaInfo(info) {
    mediaTitle.textContent = info.title;
    mediaAuthor.querySelector('span').textContent = info.uploader || 'Unknown';
    mediaDuration.textContent = info.duration_str || '--:--';
    mediaPlatform.textContent = (info.extractor || 'Web').toUpperCase();

    if (info.thumbnail) {
      mediaThumbnail.src = info.thumbnail;
      mediaThumbnail.style.display = 'block';
    } else {
      mediaThumbnail.src = '';
      mediaThumbnail.style.display = 'none';
    }

    applyPreviewVisibility(isPreviewHidden);

    // Render Video Formats
    videoFormatsContainer.innerHTML = '';
    info.video_formats.forEach((fmt) => {
      const card = document.createElement('div');
      card.className =
        'format-card bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-3 hover:border-indigo-500/50 cursor-pointer';

      let qualityBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
      if (fmt.resolution.includes('2160') || fmt.resolution.includes('4K')) {
        qualityBadgeClass = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      } else if (fmt.resolution.includes('1080')) {
        qualityBadgeClass = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      } else if (fmt.resolution.includes('720')) {
        qualityBadgeClass = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      }

      card.innerHTML = `
        <div class="space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-white leading-tight">${fmt.label}</span>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${qualityBadgeClass} shrink-0">
              ${fmt.resolution}
            </span>
          </div>
          <p class="text-[11px] text-slate-400">${fmt.note || 'MP4 Video + Audio'}</p>
        </div>
        <button class="w-full py-2.5 sm:py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Download MP4</span>
        </button>
      `;

      card.querySelector('button').addEventListener('click', (ev) => {
        ev.stopPropagation();
        triggerDownload(info.webpage_url, 'video', fmt.format_id);
      });

      card.addEventListener('click', () => {
        triggerDownload(info.webpage_url, 'video', fmt.format_id);
      });

      videoFormatsContainer.appendChild(card);
    });

    // Render Audio Formats
    audioFormatsContainer.innerHTML = '';
    info.audio_formats.forEach((fmt) => {
      const card = document.createElement('div');
      card.className =
        'format-card bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-3 hover:border-violet-500/50 cursor-pointer';

      card.innerHTML = `
        <div class="space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-white leading-tight">${fmt.label}</span>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded border bg-violet-500/10 text-violet-300 border-violet-500/30 shrink-0">
              ${fmt.ext.toUpperCase()}
            </span>
          </div>
          <p class="text-[11px] text-slate-400">${fmt.note || 'Audio only stream'}</p>
        </div>
        <button class="w-full py-2.5 sm:py-2 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
          <i data-lucide="music" class="w-3.5 h-3.5"></i>
          <span>Extract Audio</span>
        </button>
      `;

      card.querySelector('button').addEventListener('click', (ev) => {
        ev.stopPropagation();
        triggerDownload(info.webpage_url, 'audio', fmt.format_id);
      });

      card.addEventListener('click', () => {
        triggerDownload(info.webpage_url, 'audio', fmt.format_id);
      });

      audioFormatsContainer.appendChild(card);
    });

    mediaCard.classList.remove('hidden');
    lucide.createIcons();
    mediaCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Trigger Download Task
  async function triggerDownload(url, formatType, quality) {
    hideError();
    completedAlert.classList.add('hidden');
    progressSection.classList.remove('hidden');
    progressStatusText.textContent = 'Initializing task...';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    progressSpeed.textContent = '-- MB/s';
    progressEta.textContent = 'ETA: --';
    progressSize.textContent = 'Starting...';

    progressSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }

    try {
      const resp = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          format_type: formatType,
          quality: quality,
          proxy: activeProxy || undefined,
        }),
      });

      const resData = await resp.json();
      if (!resp.ok) {
        throw new Error(resData.detail || 'Failed to start download.');
      }

      const taskId = resData.task_id;
      listenToProgress(taskId);
    } catch (err) {
      showError(err.message);
      progressSection.classList.add('hidden');
    }
  }

  // SSE Progress Stream
  function listenToProgress(taskId) {
    const sse = new EventSource(`/api/progress/${taskId}/events`);
    activeEventSource = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Update progress UI
        const percent = Math.min(100, Math.max(0, data.percent || 0));
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;

        if (data.status === 'downloading') {
          progressStatusText.textContent = 'Downloading media streams...';
          progressSpeed.textContent = data.speed_str || '-- MB/s';
          progressEta.textContent = data.eta_str ? `ETA: ${data.eta_str}` : 'ETA: --';
          progressSize.textContent = `${data.downloaded_str || '0 MB'} / ${data.total_str || 'Unknown'}`;
        } else if (data.status === 'processing') {
          progressStatusText.textContent = 'Processing & merging with FFmpeg...';
          progressSpeed.textContent = 'Converting';
          progressEta.textContent = 'Almost done';
          progressBar.style.width = '99%';
          progressPercent.textContent = '99%';
        } else if (data.status === 'completed') {
          progressStatusText.textContent = 'Completed!';
          progressBar.style.width = '100%';
          progressPercent.textContent = '100%';
          progressSpeed.textContent = 'Done';
          progressEta.textContent = 'Ready';

          // Show Completed Card
          completedAlert.classList.remove('hidden');
          completedFileName.textContent = data.filename || 'Downloaded media';
          saveFileBtn.href = data.download_url || '#';
          saveFileBtn.setAttribute('download', data.filename || 'media');

          // Trigger automatic browser download
          if (data.download_url) {
            const tempLink = document.createElement('a');
            tempLink.href = data.download_url;
            tempLink.download = data.filename || '';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
          }

          sse.close();
          activeEventSource = null;
          loadHistory();
        } else if (data.status === 'failed') {
          progressStatusText.textContent = 'Download failed';
          progressBar.style.backgroundColor = '#ef4444';
          showError(data.error || 'Download failed unexpectedly.');
          sse.close();
          activeEventSource = null;
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };

    sse.onerror = (e) => {
      console.warn('SSE disconnected or complete:', e);
      sse.close();
      activeEventSource = null;
    };
  }

  // Load Download History
  async function loadHistory() {
    try {
      const resp = await fetch('/api/history');
      const files = await resp.json();

      if (!files || files.length === 0) {
        historyList.innerHTML = `
          <div class="text-center py-6 text-slate-500 text-xs">
            No downloaded files yet. Paste a link above to get started!
          </div>
        `;
        historyBadge.classList.add('hidden');
        return;
      }

      historyBadge.classList.remove('hidden');
      historyList.innerHTML = '';

      files.forEach((file) => {
        const item = document.createElement('div');
        item.className =
          'bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs';

        const isAudio = file.type === 'audio';
        const iconName = isAudio ? 'music' : 'video';
        const iconColor = isAudio ? 'text-violet-400' : 'text-indigo-400';

        item.innerHTML = `
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div class="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
              <i data-lucide="${iconName}" class="w-4 h-4 ${iconColor}"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-slate-200 truncate text-xs" title="${file.filename}">
                ${file.filename}
              </p>
              <p class="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                ${file.size_str} • ${file.created_str}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href="${file.download_url}"
              download="${file.filename}"
              class="px-3 py-2 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium flex items-center gap-1 transition-colors text-xs"
              title="Download file"
            >
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Save</span>
            </a>
            <button
              class="delete-btn p-2 sm:p-1.5 rounded-lg hover:bg-red-500/20 active:bg-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
              title="Delete from disk"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;

        item.querySelector('.delete-btn').addEventListener('click', async () => {
          if (confirm(`Delete "${file.filename}"?`)) {
            await fetch(`/api/history/${encodeURIComponent(file.filename)}`, {
              method: 'DELETE',
            });
            loadHistory();
          }
        });

        historyList.appendChild(item);
      });

      lucide.createIcons();
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  // Refresh history
  refreshHistoryBtn.addEventListener('click', loadHistory);

  // Open Downloads folder
  openFolderBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/open-folder', { method: 'POST' });
    } catch (e) {
      console.warn('Could not open folder automatically:', e);
    }
  });

  // Toggle history visibility / scroll
  toggleHistoryBtn.addEventListener('click', () => {
    document.getElementById('historySection').scrollIntoView({ behavior: 'smooth' });
  });

  // Mobile pairing modal logic
  async function setupMobileModal() {
    try {
      const resp = await fetch('/api/network-info');
      const data = await resp.json();
      cachedMobileUrl = data.mobile_url || window.location.href;
      mobileUrlDisplay.textContent = cachedMobileUrl;

      if (!qrCodeInstance && typeof QRCode !== 'undefined') {
        qrcodeContainer.innerHTML = '';
        qrCodeInstance = new QRCode(qrcodeContainer, {
          text: cachedMobileUrl,
          width: 180,
          height: 180,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M,
        });
      }
    } catch (e) {
      console.warn('Could not fetch network info:', e);
      cachedMobileUrl = window.location.href;
      mobileUrlDisplay.textContent = cachedMobileUrl;
    }
  }

  if (openMobileModalBtn) {
    openMobileModalBtn.addEventListener('click', async () => {
      mobileModal.classList.remove('hidden');
      await setupMobileModal();
    });
  }

  if (closeMobileModalBtn) {
    closeMobileModalBtn.addEventListener('click', () => {
      mobileModal.classList.add('hidden');
    });
  }

  if (mobileModal) {
    mobileModal.addEventListener('click', (e) => {
      if (e.target === mobileModal) {
        mobileModal.classList.add('hidden');
      }
    });
  }

  if (copyMobileUrlBtn) {
    copyMobileUrlBtn.addEventListener('click', async () => {
      if (cachedMobileUrl) {
        await navigator.clipboard.writeText(cachedMobileUrl);
        const icon = copyMobileUrlBtn.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'check');
          lucide.createIcons();
          setTimeout(() => {
            icon.setAttribute('data-lucide', 'copy');
            lucide.createIcons();
          }, 1500);
        }
      }
    });
  }

  // Initial history load
  loadHistory();
});
