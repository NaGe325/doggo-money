# 小狗给你挣钱 🐶💰

实时显示今天赚到多少钱的小工具，配一群可爱小狗陪你打工。

---

## 🚀 快速开始

```bash
# 装依赖（只需要第一次）
npm install

# 本地开发（边改边看）
npm run dev
# 浏览器打开 http://localhost:5173

# 打生产包
npm run build
# 产物在 dist/ 文件夹

# 预览生产包
npm run preview
```

---

## 📱 怎么放到手机桌面？

这个工具已经做成了 **PWA**（渐进式 Web 应用），任何手机浏览器打开后都能"安装"到桌面，像 App 一样。

### iPhone（Safari）

1. 用 **Safari** 打开网址（必须是 Safari，Chrome 不行）
2. 点底部分享按钮 ⬆️
3. 滑动找到「**添加到主屏幕**」
4. 自定义个名字 → 添加
5. 桌面上就有一个小狗图标啦，点开是全屏的，没有浏览器地址栏

### Android（Chrome / Edge / 任意浏览器）

1. 打开网址
2. 点右上角三个点 ⋮
3. 选「**添加到主屏幕**」或「**安装应用**」
4. 完成

---

## 🖥️ 怎么放到电脑桌面？

### macOS / Windows / Linux（Chrome / Edge / Arc）

1. 打开网址
2. **方法 A**：地址栏右边会有一个 ⊕ 或 💻 图标，点一下「安装」
3. **方法 B**：浏览器菜单 → 安装「小狗给你挣钱」
4. 装好后会出现在 Launchpad / 开始菜单 / Applications，独立窗口运行，没有标签栏

### 想做成真正的"小窗口"常驻桌面？

PWA 装好后右键应用图标 → 创建快捷方式到桌面，然后调小窗口尺寸钉住即可。

> 如果你要更专业的"悬浮小工具"效果，可以再升级成 Electron / Tauri 包成 .app/.exe，那是另一个工程量了。先把 PWA 用上一阵子看够不够。

---

## 🌍 怎么分享给别人？

需要把 `dist/` 文件夹上传到一个能公网访问的地方。下面三种从最简单到最专业排序：

### 方案 ① · Vercel（最推荐，免费 + 自动给域名）

```bash
# 全局装一次 vercel
npm install -g vercel

# 在项目根目录运行
vercel

# 按提示登录（用 GitHub 登录最快）
# 一路 Enter / Y 默认配置
# 第一次部署完会给你一个 .vercel.app 的网址
```

之后每次想更新：

```bash
npm run build
vercel --prod
```

把那个 `xxxxx.vercel.app` 的网址直接发给朋友就行了。

### 方案 ② · Netlify Drop（不会命令行的最爱，拖拽即上传）

1. 浏览器打开 <https://app.netlify.com/drop>
2. 把电脑里的 `dist` 文件夹整个拖进网页
3. 几秒后给你一个 `xxx.netlify.app` 网址，复制发人

### 方案 ③ · 局域网分享（同一个 wifi 下立即能看）

```bash
# 已经在 dev 里了，看终端 Network 那一行
# 例如 http://192.168.1.6:5173/
# 朋友在同一 WiFi 下打开这个 IP 网址即可
```

仅限**同一个网络**，关电脑就没了。适合临时给同事看一眼。

### 方案 ④ · 临时公网分享（10 分钟有效）

```bash
npx serve dist -l 5000
# 另开一个终端
npx ngrok http 5000   # 第一次需要去 ngrok.com 注册一下拿 token
```

ngrok 给的 https 网址全世界都能访问，但你电脑必须开着。

---

## 📂 文件结构

```
work- salary/
├── SalaryTicker.jsx       # 主应用（UI + 全部逻辑）
├── mascotImages.js        # 8 张小狗图（base64 内联）
├── main.jsx               # 入口
├── index.html             # HTML 模板（含 PWA meta）
├── vite.config.js         # Vite + PWA 配置
├── package.json
├── public/
│   ├── icon-192.png       # PWA 主图标
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── dist/                  # 构建产物（部署用）
```

---

## 🛠 数据存哪里？

- 所有设置（薪资、上下班时间、购买力对照、里程碑、摸鱼记录）都存在浏览器 `localStorage`
- 离线也能用（service worker 已缓存所有资源）
- 换浏览器或清空浏览数据会丢；不会上传到任何服务器

---

## ✏️ 自定义

- 想换 app 图标：替换 `public/icon-192.png` / `icon-512.png` / `apple-touch-icon.png` 同尺寸即可
- 想换小狗图：替换 `mascotImages.js` 里的 base64，或者重新跑：

```bash
# 把新图扔到一个目录后，参考之前压缩 + base64 的脚本
sips -Z 280 your.png --out resized.png
base64 -i resized.png | tr -d '\n' > out.b64
```

---

## 🐛 常见问题

- **本地开发服务器跑不起来 / Vite 报 uv_interface_addresses**：你的 shell 在沙箱里，正常终端跑没问题。
- **手机上"添加到主屏幕"没出现 PWA 图标**：必须是 https 域名才有完整 PWA 体验。本地局域网 http 也能加，但桌面图标可能用截图代替。
- **小狗使者从不弹**：第一只破冰要等启动后约 90 秒，之后 4–7 分钟随机一只。
