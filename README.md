# Glint

個人媒體管理應用程式，使用 TanStack Start 建構，部署在 Cloudflare Workers 上。使用 Cloudflare R2 儲存媒體檔案，D1 作為資料庫。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/jr-dragon/glint)

## 功能特色

- 媒體檔案上傳與管理（圖片、影片）
- 分類（Category）與創作者（Creator）標籤系統
- 自訂標籤
- 公開 / 私人可見性控制
- 透過 Cloudflare Image Resizing 自動最佳化圖片
- 公開展示頁面（沉浸式深色主題）
- 管理後台透過 Cloudflare Access 保護

## 技術棧

- **框架**: TanStack Start（React 19，檔案路由）
- **執行環境**: Cloudflare Workers（`nodejs_compat`）
- **儲存**: Cloudflare R2（媒體檔案）、Cloudflare D1（資料庫）
- **ORM**: Prisma（D1 Adapter）
- **UI**: shadcn/ui、Tailwind CSS v4、Lucide Icons
- **語言**: TypeScript（strict mode）
- **套件管理**: Bun
- **Linter / Formatter**: Biome
- **測試**: Vitest + Testing Library

## 快速開始

```bash
# 安裝依賴
bun install

# 啟動開發伺服器（port 3000）
bun dev
```

## 指令

| 指令 | 說明 |
|------|------|
| `bun dev` | 啟動開發伺服器 |
| `bun run build` | 正式環境建置 |
| `bun run deploy` | 建置並部署至 Cloudflare Workers |
| `bun run cf-typegen` | 產生 Cloudflare binding 型別 |
| `bun run migrate` | 執行 D1 資料庫遷移 |
| `bun test` | 執行測試 |
| `bun run check` | 執行 Biome lint + format 檢查 |
| `bun run check --fix` | 自動修正 lint 和格式問題 |

## 部署

### 前置需求

- [Cloudflare 帳號](https://dash.cloudflare.com/)
- 建立 D1 資料庫與 R2 Bucket
- 設定 Cloudflare Access（保護 `/admin` 路由）

### 步驟

1. 在 `wrangler.jsonc` 中設定你的 D1 database ID 與 R2 bucket name
2. 設定環境變數（`APP_NAME`、`CF_ACCESS_TEAM_DOMAIN`、`CF_ACCESS_POLICY_AUD` 等）
3. 執行資料庫遷移：`bun run migrate`
4. 部署：`bun run deploy`

## 修改介面

如果用戶想要修改前端介面，可以按照以下步驟：

1. 利用 [Google Stitch](https://stitch.withgoogle.com) 建立你覺得合適的視覺設計，至少需要產生一份設計指南（通常會包含需要什麼配色、字體、視覺效果圖）、首頁與分類頁
2. 將以上的成果用 .zip 的形式下載下來，並且解壓後放到 `.tmp` 資料夾下，並找到 `DESIGN.md`，用它替換掉現有的 `DESIGN.md`
3. 使用 Gemini CLI 或 Claude Code，輸入以下 prompt
  ```
參考 @.tmp/stitch 底下的設計稿與 @DESIGN.md，重新設計 @src/routes/index.tsx 與 @src/routes/category.$categoryName.tsx，如果有需要的話可以一併更改 @src/styles-public.css 與 @components/PublicFooter.tsx 及 @components/PublicHeader.tsx，優先使用 @src/components/ui 下的 Shadcn Components
  ```
4. 反覆調整 prompt，然後找到自己覺得合適的樣式即可