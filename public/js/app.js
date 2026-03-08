/**
 * LUMI LASHES - Client-side JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========== File Upload Preview ==========
  const mediaInput = document.getElementById('media');
  const uploadContent = document.getElementById('uploadContent');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const removeFileBtn = document.getElementById('removeFile');
  const fileNameSpan = document.getElementById('fileName');
  const uploadZone = document.getElementById('uploadZone');

  if (mediaInput) {
    mediaInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        showPreview(file);
      }
    });
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (mediaInput) mediaInput.value = '';
      hidePreview();
    });
  }

  function showPreview(file) {
    if (!uploadContent || !previewContainer || !imagePreview || !fileNameSpan) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith('image/')) {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
      } else {
        imagePreview.classList.add('hidden');
      }
      fileNameSpan.textContent = file.name;
      uploadContent.classList.add('hidden');
      previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function hidePreview() {
    if (uploadContent) uploadContent.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (imagePreview) {
      imagePreview.src = '';
      imagePreview.classList.add('hidden');
    }
  }

  // ========== Drag & Drop ==========
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-active');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-active');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-active');
      const file = e.dataTransfer.files[0];
      if (file && mediaInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        mediaInput.files = dataTransfer.files;
        showPreview(file);
      }
    });
  }

  // ========== Post Type Selection ==========
  const postTypeCards = document.querySelectorAll('.post-type-card input[type="radio"]');
  postTypeCards.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.post-type-card').forEach(card => {
        card.classList.remove('ring-2', 'ring-brand-400');
      });
      if (radio.checked) {
        radio.closest('.post-type-card').classList.add('ring-2', 'ring-brand-400');
      }
    });
  });

  // ========== Form Submission (index page) ==========
  const postForm = document.getElementById('postForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const submitSpinner = document.getElementById('submitSpinner');

  if (postForm) {
    postForm.addEventListener('submit', () => {
      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Đang xử lý...';
      if (submitSpinner) submitSpinner.classList.remove('hidden');
    });
  }

  // ========== Approve Post ==========
  const approveBtn = document.getElementById('approveBtn');
  if (approveBtn) {
    approveBtn.addEventListener('click', async () => {
      const postId = approveBtn.dataset.postId;
      const captionText = document.getElementById('captionText');
      const approveText = document.getElementById('approveText');
      const approveSpinner = document.getElementById('approveSpinner');

      if (!postId) return;

      approveBtn.disabled = true;
      if (approveText) approveText.textContent = 'Đang xử lý...';
      if (approveSpinner) approveSpinner.classList.remove('hidden');

      try {
        const response = await fetch('/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            postId,
            caption: captionText ? captionText.value : '',
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Show warnings first (if any)
          if (data.warnings && data.warnings.length > 0) {
            data.warnings.forEach((w, i) => {
              setTimeout(() => showToast(w, 'warning', 6000), i * 400);
            });
          }

          // Show result based on status
          const delay = data.warnings && data.warnings.length > 0 ? data.warnings.length * 400 + 500 : 0;

          setTimeout(() => {
            if (data.status === 'published') {
              showToast(data.message, 'success', 5000);
              // Build result details
              let details = [];
              if (data.results.facebook?.success) details.push('✅ Facebook: Đã đăng');
              if (data.results.facebook?.skipped) details.push('⏭️ Facebook: Bỏ qua');
              if (data.results.facebook && !data.results.facebook.success && !data.results.facebook.skipped) details.push('❌ Facebook: ' + (data.results.facebook.error || 'Thất bại'));
              if (data.results.instagram?.success) details.push('✅ Instagram: Đã đăng');
              if (data.results.instagram?.skipped) details.push('⏭️ Instagram: Bỏ qua');
              if (data.results.instagram && !data.results.instagram.success && !data.results.instagram.skipped) details.push('❌ Instagram: ' + (data.results.instagram.error || 'Thất bại'));

              if (details.length > 0) {
                setTimeout(() => showToast(details.join('\n'), 'info', 8000), 600);
              }
            } else if (data.status === 'created_only') {
              showToast(data.message, 'info', 8000);
            } else if (data.status === 'failed') {
              showToast(data.message, 'error', 8000);
            }

            // Redirect after showing all toasts
            setTimeout(() => {
              window.location.href = '/';
            }, data.status === 'published' ? 4000 : 5000);
          }, delay);
        } else {
          // Cancelled or error
          showToast(data.message || 'Đã xảy ra lỗi', data.action === 'cancelled' ? 'warning' : 'error');
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      } catch (error) {
        showToast('Lỗi kết nối server: ' + error.message, 'error');
        approveBtn.disabled = false;
        if (approveText) approveText.textContent = 'Thử lại';
        if (approveSpinner) approveSpinner.classList.add('hidden');
      }
    });
  }

  // ========== Regenerate Caption ==========
  const regenerateBtn = document.getElementById('regenerateBtn');
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', async () => {
      const postId = regenerateBtn.dataset.postId;
      if (!postId) return;

      regenerateBtn.disabled = true;
      regenerateBtn.querySelector('span').textContent = 'Đang tạo...';

      try {
        const response = await fetch('/api/regenerate-caption', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ postId }),
        });

        const data = await response.json();

        if (data.success) {
          const captionText = document.getElementById('captionText');
          if (captionText) captionText.value = data.caption;
          showToast('Đã tạo caption mới!', 'success');
        } else {
          showToast(data.message || 'Không thể tạo caption mới', 'error');
        }
      } catch (error) {
        showToast('Lỗi: ' + error.message, 'error');
      } finally {
        regenerateBtn.disabled = false;
        regenerateBtn.querySelector('span').textContent = 'Tạo lại caption';
      }
    });
  }

  // ========== Toast Notifications ==========
  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function showToast(message, type = 'info', duration = 4000) {
    const container = ensureToastContainer();

    const icons = {
      success: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      error: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      warning: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>`,
      info: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };

    const colors = {
      success: 'bg-green-600/95 border-green-500/50 text-green-50',
      error: 'bg-red-600/95 border-red-500/50 text-red-50',
      warning: 'bg-yellow-600/95 border-yellow-500/50 text-yellow-50',
      info: 'bg-blue-600/95 border-blue-500/50 text-blue-50',
    };

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-2xl ${colors[type] || colors.info} transform translate-x-full opacity-0 transition-all duration-300 ease-out`;
    
    // Support multiline messages
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <p class="text-sm font-medium leading-relaxed flex-1">${formattedMessage}</p>
      <button class="toast-close flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity" onclick="this.closest('.pointer-events-auto').remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    });

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        toast.classList.remove('translate-x-0', 'opacity-100');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }

  // Make showToast globally available
  window.showToast = showToast;

  // Server-provided toast errors (render-time)
  const serverToastErrorEl = document.getElementById('serverToastError');
  if (serverToastErrorEl && serverToastErrorEl.dataset.error) {
    showToast(serverToastErrorEl.dataset.error, 'error', 9000);
  }

  // Preview page notices (warnings/model errors)
  const serverNotices = document.getElementById('serverNotices');
  if (serverNotices) {
    const warn = serverNotices.dataset.warn;
    const error = serverNotices.dataset.error;
    if (warn) showToast(warn, 'warning', 9000);
    if (error) showToast(error, 'error', 10000);

    const postId = serverNotices.dataset.postId;
    const processing = serverNotices.dataset.processing === '1';
    if (postId && processing) {
      const aiImageEl = document.getElementById('previewAiImage');
      const aiPendingEl = document.getElementById('previewAiPending');
      const captionText = document.getElementById('captionText');

      const source = new EventSource('/api/stream/posts');

      source.addEventListener('post-status', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.postId !== postId) return;

          if (payload.generatedSrc && aiImageEl) {
            aiImageEl.src = payload.generatedSrc;
            aiImageEl.classList.remove('hidden');
          }
          if (aiPendingEl) aiPendingEl.classList.add('hidden');
          if (captionText && payload.caption) captionText.value = payload.caption;

          if (payload.modelError) {
            showToast(`Gemini model error: ${payload.modelError}`, 'error', 10000);
          } else {
            showToast('Ảnh AI đã tạo xong và cập nhật lên giao diện', 'success', 5000);
          }

          if (payload.status !== 'processing') {
            source.close();
          }
        } catch (error) {
          // ignore malformed payload
        }
      });

      source.onerror = () => {
        // Browser will auto-reconnect SSE
      };
    }
  }

  // ========== Loading Overlay ==========
  function showLoading(text = 'Đang xử lý...') {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading-text">${text}</p>
      `;
      document.body.appendChild(overlay);
    } else {
      overlay.querySelector('.loading-text').textContent = text;
    }
    requestAnimationFrame(() => overlay.classList.add('active'));
  }

  function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // ========== AI Settings (Model Selector + localStorage) ==========
  const SETTINGS_KEY = 'lumi.settings';

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore parse errors */ }
    return { imageModel: '', textModel: '' };
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function clearSettings() {
    localStorage.removeItem(SETTINGS_KEY);
  }

  // Populate hidden form inputs from localStorage so form POST includes model selection
  function populateHiddenInputs() {
    const settings = loadSettings();
    const hiddenImage = document.getElementById('hiddenImageModel');
    const hiddenText = document.getElementById('hiddenTextModel');
    if (hiddenImage) hiddenImage.value = settings.imageModel || '';
    if (hiddenText) hiddenText.value = settings.textModel || '';
    updateActiveModelLabel(settings);
  }

  // Update the indicator text below the submit button
  function updateActiveModelLabel(settings) {
    const label = document.getElementById('activeModelLabel');
    if (!label) return;

    const parts = [];
    if (settings.imageModel) parts.push(settings.imageModel);
    if (settings.textModel) parts.push(settings.textModel);

    if (parts.length > 0) {
      label.textContent = parts.join(' / ');
      label.className = 'text-brand-400 font-medium';
    } else {
      label.textContent = 'Default (server)';
      label.className = 'text-dark-400';
    }
  }

  // Settings Modal
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsClose = document.getElementById('settingsClose');
  const settingsLoading = document.getElementById('settingsLoading');
  const settingsContent = document.getElementById('settingsContent');
  const settingsSave = document.getElementById('settingsSave');
  const settingsReset = document.getElementById('settingsReset');
  const settingImageModel = document.getElementById('settingImageModel');
  const settingTextModel = document.getElementById('settingTextModel');
  const settingsError = document.getElementById('settingsError');
  const settingsErrorText = document.getElementById('settingsErrorText');

  let modelsLoaded = false;
  let serverDefaults = { imageModel: '', textModel: '' };

  function openSettings() {
    if (!settingsModal) return;
    settingsModal.classList.remove('hidden');
    // Trigger transition on next frame
    requestAnimationFrame(() => {
      settingsModal.classList.add('open');
    });
    document.body.style.overflow = 'hidden';

    if (!modelsLoaded) {
      fetchAndPopulateModels();
    }
  }

  function closeSettings() {
    if (!settingsModal) return;
    settingsModal.classList.remove('open');
    setTimeout(() => {
      settingsModal.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  async function fetchAndPopulateModels() {
    if (settingsLoading) settingsLoading.classList.remove('hidden');
    if (settingsContent) settingsContent.classList.add('hidden');
    if (settingsError) settingsError.classList.add('hidden');

    try {
      const res = await fetch('/api/gemini-models');
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch models');
      }

      serverDefaults = data.defaults || { imageModel: '', textModel: '' };

      // Populate image model dropdown
      if (settingImageModel) {
        settingImageModel.innerHTML = '<option value="">-- Server default (' + serverDefaults.imageModel + ') --</option>';
        (data.models.image || []).forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = m.id + (m.name && m.name !== m.id ? ' (' + m.name + ')' : '');
          settingImageModel.appendChild(opt);
        });
      }

      // Populate text model dropdown
      if (settingTextModel) {
        settingTextModel.innerHTML = '<option value="">-- Server default (' + serverDefaults.textModel + ') --</option>';
        (data.models.text || []).forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = m.id + (m.name && m.name !== m.id ? ' (' + m.name + ')' : '');
          settingTextModel.appendChild(opt);
        });
      }

      // Server defaults info
      const defaultImageEl = document.getElementById('serverDefaultImage');
      const defaultTextEl = document.getElementById('serverDefaultText');
      if (defaultImageEl) defaultImageEl.textContent = serverDefaults.imageModel;
      if (defaultTextEl) defaultTextEl.textContent = serverDefaults.textModel;

      // Apply saved settings to dropdowns
      const saved = loadSettings();
      if (settingImageModel && saved.imageModel) settingImageModel.value = saved.imageModel;
      if (settingTextModel && saved.textModel) settingTextModel.value = saved.textModel;

      modelsLoaded = true;
      if (settingsLoading) settingsLoading.classList.add('hidden');
      if (settingsContent) settingsContent.classList.remove('hidden');

    } catch (err) {
      if (settingsLoading) settingsLoading.classList.add('hidden');
      if (settingsContent) settingsContent.classList.remove('hidden');
      if (settingsError) {
        settingsError.classList.remove('hidden');
        if (settingsErrorText) settingsErrorText.textContent = 'Could not load models: ' + err.message + '. You can still type a model name manually.';
      }

      // Fallback: allow the dropdowns to be editable text inputs for manual entry
      // (they'll just have the default option)
    }
  }

  // Event listeners
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (settingsOverlay) settingsOverlay.addEventListener('click', closeSettings);
  if (settingsClose) settingsClose.addEventListener('click', closeSettings);

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal && settingsModal.classList.contains('open')) {
      closeSettings();
    }
  });

  if (settingsSave) {
    settingsSave.addEventListener('click', () => {
      const newSettings = {
        imageModel: settingImageModel ? settingImageModel.value : '',
        textModel: settingTextModel ? settingTextModel.value : '',
      };
      saveSettings(newSettings);
      populateHiddenInputs();
      closeSettings();
      showToast('Settings saved', 'success', 3000);
    });
  }

  if (settingsReset) {
    settingsReset.addEventListener('click', () => {
      clearSettings();
      if (settingImageModel) settingImageModel.value = '';
      if (settingTextModel) settingTextModel.value = '';
      populateHiddenInputs();
      showToast('Reset to server defaults', 'info', 3000);
    });
  }

  // On page load: populate hidden inputs from localStorage
  populateHiddenInputs();
});
