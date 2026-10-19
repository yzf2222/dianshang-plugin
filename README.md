# 电商图片提取下载助手

一个 Chrome 浏览器扩展（Manifest V3），用于在电商商品详情页**一键提取页面所有图片**，在独立预览页勾选后**批量下载为 PNG**。

支持淘宝、天猫、京东、拼多多、1688、苏宁易购。

> 在线主页：https://<你的GitHub用户名>.github.io/dianshang-plugin/

---

## 功能特性

- **整页图片提取**：识别 `img`、懒加载属性（`data-src` / `data-ks-lazyload` 等）、`srcset`、`picture > source` 以及 `background-image`
- **智能过滤**：自动排除 1x1 埋点图、sprite 雪碧图、icon / logo / avatar 等装饰图
- **勾选式下载**：预览页支持全选、反选、单张勾选，只下载需要的图片
- **统一输出 PNG**：JPG / WebP / AVIF 等格式通过 Canvas 重新编码为无损 PNG
- **自动命名**：按 `001.png`、`002.png` 递增，保存到 `电商图片/商品标题/` 目录
- **进度与容错**：带进度条和失败清单，单张失败不影响整体流程
- **完全本地处理**：不经过任何第三方服务器

---

## 目录结构

```
dianshang-plugin/
├── manifest.json           # MV3 配置（扩展根目录 = 本文件夹）
├── background.js           # Service Worker：接收图片列表、打开预览页
├── content.js              # 内容脚本：注入右下角按钮、采集图片
├── content.css             # 浮动按钮与提示条样式
├── gallery.html            # 图片预览页
├── gallery.js              # 预览页逻辑：勾选 / 转 PNG / 下载
├── gallery.css             # 预览页样式
├── popup.html              # 工具栏弹窗
├── popup.js                # 弹窗逻辑：检测页面、快捷提取
├── icons/                  # 扩展图标 16 / 32 / 48 / 128
├── docs/
│   ├── index.html          # 官网首页（GitHub Pages 发布 /docs）
│   └── demo.html           # 演示用商品详情页（本地测试插件）
├── 1-open-site.bat         # 打开官网预览
├── 2-open-demo.bat         # 打开演示商品页
├── 3-git-commit.bat        # 一键 git init / add / commit
├── 4-push-github.bat       # 一键 push 到 GitHub
└── README.md
```

---

## 安装（开发者模式）

1. 打开 Chrome，地址栏输入 `chrome://extensions` 并回车
2. 打开右上角 **开发者模式** 开关
3. 点击 **加载已解压的扩展程序**
4. 选择 **本项目根目录** `D:\dianshang-plugin`（`manifest.json` 就在这一层）
5. 加载成功后，工具栏会出现扩展图标

---

## 使用

1. 打开淘宝 / 天猫 / 京东 / 拼多多的商品详情页
2. 等待页面图片加载完成（可先向下滚动一遍触发懒加载）
3. 点击页面右下角的 **「获取图片」** 按钮
4. 自动打开预览页，勾选需要的图片
5. 点击 **下载所选**，PNG 文件会保存到 `下载/电商图片/商品标题/`

---

## 本地预览官网

直接双击根目录的 `index.html` 用浏览器打开即可，无需任何依赖。

---

## 发布到 GitHub Pages

```bash
git init
git add .
git commit -m "feat: 电商图片提取下载助手 v1.0.0"
git branch -M main
git remote add origin https://github.com/<你的用户名>/dianshang-plugin.git
git push -u origin main
```

推送完成后：

1. 打开仓库页面 → **Settings** → 左侧 **Pages**
2. **Source** 选择 `Deploy from a branch`
3. **Branch** 选择 `main`，目录选 **`/docs`**
4. 点击 **Save**，等待 1~2 分钟
5. 访问 `https://<你的用户名>.github.io/dianshang-plugin/`

---

## 技术栈

- Chrome Extension Manifest V3
- 原生 JavaScript（无构建步骤）
- Canvas / `createImageBitmap` 图片格式转换
- `chrome.downloads` 批量下载

---

## 说明

本项目仅用于学习与技术交流。提取的图片版权归原平台与商家所有，请勿用于商业用途。
