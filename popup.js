/**
 * Popup 逻辑：检测当前标签页是否支持，提供快捷入口
 */
(function () {
  'use strict';

  const SUPPORTED_HOSTS = [
    'taobao.com',
    'tmall.com',
    'jd.com',
    'pinduoduo.com',
    'yangkeduo.com',
    '1688.com',
    'suning.com',
    'vip.com'
  ];

  const statusEl = document.getElementById('status');
  const btnExtract = document.getElementById('btnExtract');
  const btnGallery = document.getElementById('btnGallery');

  let currentTab = null;
  let supported = false;

  function isSupported(url) {
    try {
      const host = new URL(url).hostname;
      return SUPPORTED_HOSTS.some((h) => host === h || host.endsWith('.' + h) || host.endsWith(h));
    } catch (e) {
      return false;
    }
  }

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  // 查询当前标签页
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentTab = tabs && tabs[0] ? tabs[0] : null;

    if (!currentTab || !currentTab.url) {
      setStatus('无法获取当前页面信息', 'warn');
      btnExtract.disabled = true;
      return;
    }

    supported = isSupported(currentTab.url);

    if (supported) {
      setStatus('当前页面已支持，可直接提取图片', 'ok');
      btnExtract.disabled = false;
    } else {
      setStatus('当前页面不在支持列表内，请先打开淘宝 / 京东 / 拼多多商品详情页', 'warn');
      btnExtract.disabled = true;
    }
  });

  // 提取当前页
  btnExtract.addEventListener('click', function () {
    if (!currentTab || !currentTab.id) return;

    btnExtract.disabled = true;
    btnExtract.textContent = '正在提取…';

    chrome.scripting.executeScript(
      {
        target: { tabId: currentTab.id },
        func: function () {
          // 模拟点击页面上的浮动按钮，复用采集逻辑
          const b = document.getElementById('__ds_img_helper_btn__');
          if (b) {
            b.click();
            return { clicked: true };
          }
          return { clicked: false };
        }
      },
      function (results) {
        btnExtract.textContent = '提取当前页图片';
        btnExtract.disabled = false;

        if (chrome.runtime.lastError) {
          setStatus('提取失败：' + chrome.runtime.lastError.message, 'warn');
          return;
        }

        const r = results && results[0] ? results[0].result : null;
        if (r && r.clicked) {
          setStatus('已触发提取，请稍候…', 'ok');
          setTimeout(() => window.close(), 900);
        } else {
          setStatus('页面尚未加载提取按钮，请刷新页面后重试', 'warn');
        }
      }
    );
  });

  // 打开预览页
  btnGallery.addEventListener('click', function () {
    chrome.tabs.create({ url: chrome.runtime.getURL('gallery.html') });
    window.close();
  });
})();
