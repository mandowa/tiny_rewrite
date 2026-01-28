# Deployment Guide

## Cloudflare Pages + Workers 部署

### 1. Worker (API Proxy) 已部署

✅ Worker 名稱: `twilight-tree-0846`
✅ URL: `https://twilight-tree-0846.didjerama.workers.dev`
✅ 環境變數已設定 (API keys 安全儲存)

### 2. 部署到 Cloudflare Pages

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → 選擇 `mandowa/tiny_rewrite`
4. 設定：
   - **Project name**: `writing-flow`
   - **Production branch**: `main`
   - **Framework preset**: None
   - **Build command**: 留空（或填 `echo "Static site"`）
   - **Build output directory**: `/`
5. **Environment variables** → Add variable:
   - 不需要設定（API keys 在 Worker 中）
6. **Save and Deploy**

**重要**：部署後需要手動處理檔案：
- Cloudflare Pages 會直接使用 repo 中的檔案
- 需要在 repo 中把 `index.production.html` 重新命名為 `index.html`
- 或使用 Cloudflare Pages Functions 來處理

### 3. 本地測試

**開發版本（直接 API）**：
```bash
open index.html
# 使用 config.js (包含你的 API keys)
```

**Production 版本（使用 proxy）**：
```bash
open index.production.html
# 使用 config.production.js (通過 Worker proxy)
```

### 4. 檔案說明

**本地開發**：
- `index.html` - 開發版本（已在 .gitignore）
- `config.js` - 包含 API keys（已在 .gitignore）

**部署使用**：
- `index.production.html` - production 版本
- `config.production.js` - 使用 Worker proxy
- `api-proxy.js` - proxy client

### 5. 推送到 GitHub

```bash
git add .
git commit -m "Add Cloudflare Worker proxy support"
git push origin main
```

注意：`index.html` 和 `config.js` 不會被推送（已在 .gitignore）

### 6. 驗證部署

部署完成後，訪問你的 Pages URL (例如 `https://writing-flow.pages.dev`)：

1. 打開瀏覽器開發者工具 (F12)
2. 檢查 Console 應該看到: `Using API Proxy: https://writing-flow-proxy...`
3. 測試 rewrite 功能
4. 確認 Network tab 中請求都發到 Worker proxy

### 安全性

✅ API keys 儲存在 Worker 環境變數中
✅ 前端程式碼不包含任何 API keys
✅ 所有 API 請求通過 Worker proxy
✅ CORS 已正確設定

### 成本

- **Cloudflare Pages**: 免費 (無限請求)
- **Cloudflare Workers**: 免費額度 100,000 請求/天
- **Gemini API**: ~$0.13/月 (1500 次請求)

### 故障排除

**問題**: Worker 回傳 CORS 錯誤
**解決**: 檢查 Worker 的 CORS headers 設定

**問題**: API 請求失敗
**解決**: 
1. 檢查 Worker 環境變數是否正確設定
2. 檢查 Worker logs: Dashboard → Workers → writing-flow-proxy → Logs

**問題**: 本地測試 production 版本
**解決**: 直接打開 `index.production.html`
