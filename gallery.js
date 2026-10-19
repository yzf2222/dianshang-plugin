/**
 * 图片预览页逻辑
 * - 读取采集结果
 * - 网格展示、勾选、全选、反选
 * - 批量转换为 PNG 并下载
 */

(function () {
  'use strict';

  const state = {
    images: [],          // [{url, selected, index}]
    meta: null,
    downloading: false
  };

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);

  const el = {
    grid: $('grid'),
    empty: $('empty'),
    metaTitle: $('metaTitle'),
    statTotal: $('statTotal'),
    statSelected: $('statSelected'),
    chkAll: $('chkAll'),
    btnSelectAll: $('btnSelectAll'),
    btnInvert: $('btnInvert'),
    btnDownload: $('btnDownload'),
    btnDownload2: $('btnDownload2'),
    btnDownloadText: $('btnDownloadText'),
    statusText: $('statusText'),
    lightbox: $('lightbox'),
    lbImg: $('lbImg'),
    lbInfo: $('lbInfo'),
    lbClose: $('lbClose'),
    progressWrap: $('progressWrap'),
    progressBar: $('progressBar'),
    progressText: $('progressText')
  };

  const CHECK_SVG =
    '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  /* ---------- 工具 ---------- */
  function getHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      return '';
    }
  }

  function pad3(n) {
    return String(n).padStart(3, '0');
  }

  function sanitize(name) {
    return String(name || 'images')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40) || 'images';
  }

  function setStatus(text) {
    el.statusText.textContent = text || '';
  }

  function updateStats() {
    const total = state.images.length;
    const selected = state.images.filter((x) => x.selected).length;
    el.statTotal.textContent = total;
    el.statSelected.textContent = selected;

    // 下载按钮可用性
    const disabled = selected === 0 || state.downloading;
    el.btnDownload.disabled = disabled;
    el.btnDownload2.disabled = disabled;

    // 全选框状态
    el.chkAll.checked = total > 0 && selected === total;
    el.chkAll.indeterminate = selected > 0 && selected < total;
  }

  /* ---------- 渲染 ---------- */
  function render() {
    el.grid.innerHTML = '';

    if (!state.images.length) {
      el.empty.hidden = false;
      el.grid.hidden = true;
      updateStats();
      return;
    }

    el.empty.hidden = true;
    el.grid.hidden = false;

    const frag = document.createDocumentFragment();

    state.images.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'card' + (item.selected ? ' selected' : '');
      card.dataset.index = String(i);

      card.innerHTML = `
        <div class="card-thumb">
          <div class="card-loading">加载中…</div>
          <div class="card-check">${CHECK_SVG}</div>
          <div class="card-index">${i + 1}</div>
          <div class="card-badge" hidden></div>
        </div>
        <div class="card-foot">
          <div class="card-host">${getHost(item.url)}</div>
        </div>
      `;

      const thumb = card.querySelector('.card-thumb');
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.alt = '商品图 ' + (i + 1);

      img.onload = function () {
        const loadingEl = card.querySelector('.card-loading');
        if (loadingEl) loadingEl.remove();
        const badge = card.querySelector('.card-badge');
        if (badge && img.naturalWidth) {
          badge.hidden = false;
          badge.textContent = img.naturalWidth + ' × ' + img.naturalHeight;
        }
      };

      img.onerror = function () {
        const loadingEl = card.querySelector('.card-loading');
        if (loadingEl) {
          loadingEl.textContent = '加载失败';
          loadingEl.style.color = '#ef4444';
        }
      };

      img.src = item.url;
      thumb.insertBefore(img, thumb.firstChild);

      // 点击卡片：切换选中
      card.addEventListener('click', function (e) {
        // 点击复选框区域或卡片本体都算切换
        toggleSelect(i);
      });

      frag.appendChild(card);
    });

    el.grid.appendChild(frag);
    updateStats();
  }

  function toggleSelect(i) {
    const item = state.images[i];
    if (!item) return;
    item.selected = !item.selected;
    const card = el.grid.querySelector('.card[data-index="' + i + '"]');
    if (card) card.classList.toggle('selected', item.selected);
    updateStats();
  }

  function selectAll(value) {
    state.images.forEach((x) => (x.selected = value));
    el.grid.querySelectorAll('.card').forEach((c) => c.classList.toggle('selected', value));
    updateStats();
  }

  function invert() {
    state.images.forEach((x) => (x.selected = !x.selected));
    el.grid.querySelectorAll('.card').forEach((c, i) => {
      c.classList.toggle('selected', state.images[i].selected);
    });
    updateStats();
  }

  /* ---------- 大图预览 ---------- */
  function openLightbox(index) {
    const item = state.images[index];
    if (!item) return;
    el.lbImg.src = item.url;
    el.lbInfo.textContent = item.url;
    el.lightbox.hidden = false;
  }

  function closeLightbox() {
    el.lightbox.hidden = true;
    el.lbImg.src = '';
  }

  /* ---------- 下载核心：转 PNG ---------- */
  async function fetchAsPngBlob(url) {
    // 扩展页面拥有 host_permissions，fetch 可跨域
    const resp = await fetch(url, { credentials: 'omit', mode: 'cors' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const srcBlob = await resp.blob();

    // 已经是 PNG 且尺寸正常，直接返回
    if (srcBlob.type === 'image/png') {
      return srcBlob;
    }

    let bitmap;
    try {
      bitmap = await createImageBitmap(srcBlob);
    } catch (e) {
      throw new Error('图片解析失败');
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    // PNG 支持透明，先铺白底更稳妥
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    if (bitmap.close) bitmap.close();

    return await new Promise((resolve, reject) => {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('PNG 编码失败'));
      }, 'image/png');
    });
  }

  function downloadBlob(blob, filename) {
    return new Promise((resolve, reject) => {
      const objUrl = URL.createObjectURL(blob);
      chrome.downloads.download(
        {
          url: objUrl,
          filename: filename,
          saveAs: false,
          conflictAction: 'uniquify'
        },
        function (downloadId) {
          if (chrome.runtime.lastError || downloadId === undefined) {
            URL.revokeObjectURL(objUrl);
            reject(new Error((chrome.runtime.lastError && chrome.runtime.lastError.message) || '下载失败'));
          } else {
            // 延迟释放，避免下载尚未读取就被回收
            setTimeout(() => URL.revokeObjectURL(objUrl), 30000);
            resolve(downloadId);
          }
        }
      );
    });
  }

  function showProgress(done, total) {
    if (done === 0) {
      el.progressWrap.classList.add('active');
    }
    const pct = total ? Math.round((done / total) * 100) : 0;
    el.progressBar.style.width = pct + '%';
    el.progressText.textContent = done + ' / ' + total + '  已处理（' + pct + '%）';
    if (done >= total) {
      setTimeout(function () {
        el.progressWrap.classList.remove('active');
        el.progressBar.style.width = '0%';
        el.progressText.textContent = '';
      }, 2200);
    }
  }

  async function startDownload() {
    if (state.downloading) return;

    const picked = state.images
      .map((x, i) => ({ ...x, index: i }))
      .filter((x) => x.selected);

    if (!picked.length) {
      setStatus('请先选择要下载的图片');
      return;
    }

    state.downloading = true;
    updateStats();

    const folder = '电商图片/' + sanitize(state.meta && state.meta.title);
    let ok = 0;
    let fail = 0;
    const failedList = [];

    el.btnDownloadText.textContent = '下载中 ' + 0 + '/' + picked.length;
    showProgress(0, picked.length);

    for (let i = 0; i < picked.length; i++) {
      const item = picked[i];
      const filename = folder + '/' + pad3(i + 1) + '.png';

      try {
        const pngBlob = await fetchAsPngBlob(item.url);
        await downloadBlob(pngBlob, filename);
        ok++;
      } catch (e) {
        fail++;
        failedList.push(item.url);
        console.warn('[下载失败]', item.url, e);
      }

      const done = i + 1;
      showProgress(done, picked.length);
      el.btnDownloadText.textContent = '下载中 ' + done + '/' + picked.length;

      // 轻微节流，避免瞬间大量请求被目标站拦截
      await new Promise((r) => setTimeout(r, 120));
    }

    state.downloading = false;
    el.btnDownloadText.textContent = '下载所选';
    updateStats();

    if (fail === 0) {
      setStatus('全部完成：成功 ' + ok + ' 张');
    } else {
      setStatus('完成：成功 ' + ok + ' 张，失败 ' + fail + ' 张');
    }

    // 失败项弹窗提示，方便排查
    if (fail > 0) {
      console.group('[电商图片提取] 下载失败清单');
      failedList.forEach((u) => console.log(u));
      console.groupEnd();
    }
  }

  /* ---------- 事件绑定 ---------- */
  el.chkAll.addEventListener('change', function () {
    selectAll(el.chkAll.checked);
  });

  el.btnSelectAll.addEventListener('click', function () {
    selectAll(true);
  });

  el.btnInvert.addEventListener('click', invert);

  el.btnDownload.addEventListener('click', startDownload);
  el.btnDownload2.addEventListener('click', startDownload);

  el.lbClose.addEventListener('click', closeLightbox);
  el.lightbox.addEventListener('click', function (e) {
    if (e.target === el.lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !el.lightbox.hidden) closeLightbox();
  });

  // 双击卡片看图（单击是选中，避免冲突）
  el.grid.addEventListener('dblclick', function (e) {
    const card = e.target.closest('.card');
    if (!card) return;
    openLightbox(Number(card.dataset.index));
  });

  /* ---------- 初始化 ---------- */
  function init() {
    chrome.storage.local.get(['dsImages', 'dsMeta'], function (data) {
      const imgs = Array.isArray(data.dsImages) ? data.dsImages : [];
      state.meta = data.dsMeta || null;

      el.metaTitle.textContent = state.meta
        ? state.meta.title + ' · ' + getHost(state.meta.url)
        : '来源页面信息缺失';

      // 默认全部勾选，减少操作步骤；用户可随时取消
      state.images = imgs.map((url) => ({ url: url, selected: true }));
      render();
    });
  }

  init();
})();
