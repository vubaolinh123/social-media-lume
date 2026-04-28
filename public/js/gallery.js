document.addEventListener('DOMContentLoaded', () => {
  const galleryList = document.getElementById('galleryList');
  const galleryCount = document.getElementById('galleryCount');
  const refreshBtn = document.getElementById('refreshGalleryBtn');

  function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type, 5000);
      return;
    }
    window.alert(message);
  }

  async function callApi(url, method = 'POST', body = null) {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try {
      data = await res.json();
    } catch (error) {
      data = { success: false, message: 'Invalid server response' };
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed (${res.status})`);
    }

    return data;
  }

  function bindActionButtons(root = document) {
    root.querySelectorAll('.btn-post-facebook').forEach((btn) => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const { postId } = btn.dataset;
        if (!postId) return;

        btn.disabled = true;
        const originalLabel = btn.textContent;
        btn.textContent = 'Đang đăng...';

        try {
          const caption = btn.closest('article').querySelector('.caption-edit')?.value || '';
          const data = await callApi(`/api/posts/${postId}/publish/facebook`, 'POST', { caption });
          showToast(data.message || 'Đã xử lý Facebook', data.success ? 'success' : 'warning');
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = originalLabel;
        }
      });
    });

    root.querySelectorAll('.btn-post-instagram').forEach((btn) => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const { postId } = btn.dataset;
        if (!postId) return;

        btn.disabled = true;
        const originalLabel = btn.textContent;
        btn.textContent = 'Đang đăng...';

        try {
          const caption = btn.closest('article').querySelector('.caption-edit')?.value || '';
          const data = await callApi(`/api/posts/${postId}/publish/instagram`, 'POST', { caption });
          showToast(data.message || 'Đã xử lý Instagram', data.success ? 'success' : 'warning');
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = originalLabel;
        }
      });
    });

    root.querySelectorAll('.btn-delete-post').forEach((btn) => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const { postId } = btn.dataset;
        if (!postId) return;

        const confirmed = window.confirm('Bạn chắc chắn muốn xóa cả ảnh gốc và ảnh AI của item này?');
        if (!confirmed) return;

        btn.disabled = true;
        const originalLabel = btn.textContent;
        btn.textContent = 'Đang xóa...';

        try {
          const data = await callApi(`/api/posts/${postId}`, 'DELETE');
          showToast(data.message || 'Đã xóa item', 'success');
          await refreshGallery();
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = originalLabel;
        }
      });
    });
  }

  function updateCard(card, item) {
    if (!card) return;
    const statusEl = card.querySelector('.generation-status');
    if (statusEl) statusEl.textContent = item.generationStatus;

    const generatedImageEl = card.querySelector('.generated-image');
    const pendingEl = card.querySelector('.generated-pending');
    if (item.generatedSrc && generatedImageEl) {
      generatedImageEl.src = item.generatedSrc;
      generatedImageEl.classList.remove('hidden');
      if (pendingEl) pendingEl.classList.add('hidden');
    } else if (pendingEl) {
      pendingEl.classList.remove('hidden');
      pendingEl.textContent = item.generationStatus === 'processing'
        ? 'Đang tạo ảnh AI... sẽ tự cập nhật khi xong.'
        : 'Không có ảnh AI hợp lệ.';
    }
  }

  async function refreshGallery() {
    try {
      const data = await callApi('/api/gallery', 'GET');
      const items = data.items || [];

      if (galleryCount) galleryCount.textContent = String(items.length);

      items.forEach((item) => {
        const card = galleryList?.querySelector(`[data-post-id="${item.id}"]`);
        if (card) updateCard(card, item);
      });

      // remove cards that no longer exist
      if (galleryList) {
        galleryList.querySelectorAll('[data-post-id]').forEach((card) => {
          const id = card.getAttribute('data-post-id');
          const exists = items.some((x) => x.id === id);
          if (!exists) card.remove();
        });
      }
    } catch (error) {
      // silent polling failure
    }
  }

  bindActionButtons(document);
  refreshBtn?.addEventListener('click', () => refreshGallery());

  // realtime updates via SSE
  const source = new EventSource('/api/stream/posts');
  source.addEventListener('post-status', async (event) => {
    try {
      const payload = JSON.parse(event.data);
      const card = galleryList?.querySelector(`[data-post-id="${payload.postId}"]`);
      if (!card) {
        await refreshGallery();
        return;
      }

      const statusEl = card.querySelector('.generation-status');
      if (statusEl) statusEl.textContent = payload.status;

      const generatedImageEl = card.querySelector('.generated-image');
      const pendingEl = card.querySelector('.generated-pending');
      if (payload.generatedSrc && generatedImageEl) {
        generatedImageEl.src = payload.generatedSrc;
        generatedImageEl.classList.remove('hidden');
        if (pendingEl) pendingEl.classList.add('hidden');
      }

      if (payload.modelError) {
        showToast(`Gemini model error: ${payload.modelError}`, 'error');
      }
    } catch (error) {
      // ignore
    }
  });

  source.onerror = () => {
    // browser auto-reconnects SSE
  };
});
