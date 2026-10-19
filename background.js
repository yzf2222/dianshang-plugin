/**
 * 后台 Service Worker
 * 负责接收内容脚本采集到的图片列表，存入本地存储，并打开图片预览页
 */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || !msg.type) return;

  if (msg.type === 'DS_COLLECTED') {
    const payload = {
      dsImages: Array.isArray(msg.images) ? msg.images : [],
      dsMeta: {
        title: msg.pageTitle || '未命名页面',
        url: msg.pageUrl || '',
        time: Date.now()
      }
    };

    chrome.storage.local.set(payload, function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('gallery.html') });
      sendResponse({ ok: true, count: payload.dsImages.length });
    });

    return true; // 保持消息通道，等待异步响应
  }

  if (msg.type === 'DS_OPEN_GALLERY') {
    chrome.tabs.create({ url: chrome.runtime.getURL('gallery.html') });
    sendResponse({ ok: true });
    return true;
  }
});

// 安装时输出提示，方便确认插件已加载
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    console.log('[电商图片提取下载助手] 安装成功');
  }
});
