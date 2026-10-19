/**
 * 电商图片提取下载助手 - 内容脚本
 * 在支持的电商详情页右下角注入"获取图片"按钮，点击后收集页面所有商品图
 */
(function () {
  if (window.__DS_IMG_HELPER_LOADED__) return;
  window.__DS_IMG_HELPER_LOADED__ = true;

  const SUPPORTED_HOSTS = [
    'taobao.com',
    'tmall.com',
    'jd.com',
    'pinduoduo.com',
    'yangkeduo.com',
    '1688.com',
    'suning.com',
    'vip.com',
    'detail.tmall.com'
  ];

  const host = location.hostname || '';
  const isLocalDemo =
    location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1';
  const isSupported =
    isLocalDemo ||
    SUPPORTED_HOSTS.some((h) => host === h || host.endsWith('.' + h));

  // 不在支持的站点时不注入按钮，避免干扰其他网页
  if (!isSupported) return;

  /* ---------------- 工具函数 ---------------- */

  function normalize(u) {
    if (!u) return null;
    u = String(u).trim();
    if (!u || u.startsWith('data:') || u.startsWith('blob:')) return null;
    if (u.startsWith('//')) u = 'https:' + u;
    if (!/^https?:\/\//i.test(u)) return null;
    // 过滤明显的装饰图/小图标
    if (/\.(gif|svg)(\?|$)/i.test(u)) return null;
    if (/(sprite|icon|logo|avatar|qrcode|loading|placeholder|blank|1x1)/i.test(u)) return null;
    return u;
  }

  function pushCandidate(set, u) {
    const n = normalize(u);
    if (n) set.add(n);
  }

  /* ---------------- 采集图片 ---------------- */

  function collectImages() {
    const found = new Set();

    // 1) 所有 img 标签
    document.querySelectorAll('img').forEach((img) => {
      pushCandidate(found, img.currentSrc);
      pushCandidate(found, img.src);
      ['data-src', 'data-ks-lazyload', 'data-lazy-img', 'data-original', 'data-img', 'data-url'].forEach((attr) => {
        pushCandidate(found, img.getAttribute(attr));
      });

      // srcset
      const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
      if (srcset) {
        srcset.split(',').forEach((part) => {
          const url = part.trim().split(/\s+/)[0];
          pushCandidate(found, url);
        });
      }
    });

    // 2) 背景图
    const all = document.querySelectorAll('div, span, a, li, section, figure');
    all.forEach((el) => {
      let bg = '';
      try {
        bg = getComputedStyle(el).backgroundImage;
      } catch (e) {
        return;
      }
      if (!bg || bg === 'none') return;
      const matches = bg.matchAll(/url\(["']?(.*?)["']?\)/g);
      for (const m of matches) pushCandidate(found, m[1]);
    });

    // 3) picture > source
    document.querySelectorAll('picture source').forEach((s) => {
      const ss = s.getAttribute('srcset');
      if (ss) {
        ss.split(',').forEach((part) => pushCandidate(found, part.trim().split(/\s+/)[0]));
      }
    });

    return Array.from(found);
  }

  /* ---------------- 按钮 UI ---------------- */

  const btn = document.createElement('div');
  btn.id = '__ds_img_helper_btn__';
  btn.innerHTML = '<span class="ds-ico">IMG</span><span class="ds-txt">获取图片</span>';
  btn.title = '提取本页所有商品图片';

  const toast = document.createElement('div');
  toast.id = '__ds_img_helper_toast__';

  function showToast(text, type) {
    toast.textContent = text;
    toast.className = 'ds-toast-show' + (type ? ' ds-toast-' + type : '');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.className = '';
    }, 2600);
  }

  btn.addEventListener('click', function () {
    if (btn.classList.contains('ds-loading')) return;
    btn.classList.add('ds-loading');
    const txt = btn.querySelector('.ds-txt');
    const old = txt.textContent;
    txt.textContent = '正在提取...';

    // 让浏览器有机会渲染 loading
    setTimeout(function () {
      let images = [];
      try {
        images = collectImages();
      } catch (e) {
        images = [];
      }

      if (!images.length) {
        btn.classList.remove('ds-loading');
        txt.textContent = old;
        showToast('未找到图片，请先滚动页面加载全部商品图', 'warn');
        return;
      }

      chrome.runtime.sendMessage(
        {
          type: 'DS_COLLECTED',
          images: images,
          pageTitle: document.title,
          pageUrl: location.href
        },
        function (resp) {
          btn.classList.remove('ds-loading');
          txt.textContent = old;
          if (chrome.runtime.lastError) {
            showToast('打开预览页失败：' + chrome.runtime.lastError.message, 'warn');
            return;
          }
          showToast('已提取 ' + images.length + ' 张图片，正在打开预览页', 'ok');
        }
      );
    }, 60);
  });

  function mount() {
    if (document.body && !document.getElementById('__ds_img_helper_btn__')) {
      document.body.appendChild(btn);
      document.body.appendChild(toast);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // 兼容 SPA 路由切换后 body 被重建的情况（节流，避免频繁触发）
  let remountTimer = null;
  const observer = new MutationObserver(function () {
    if (remountTimer) return;
    remountTimer = setTimeout(function () {
      remountTimer = null;
      if (document.body && !document.getElementById('__ds_img_helper_btn__')) {
        mount();
      }
    }, 500);
  });
  if (document.body) {
    observer.observe(document.body, { childList: true });
  }
})();
