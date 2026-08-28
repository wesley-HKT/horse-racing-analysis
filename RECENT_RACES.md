# 實驗性近期賽事快照

本功能提供一條**本機、選擇性、預設停用**的近期香港賽事資料路徑。它使用第三方 MIT 套件 [`hkjc-api`](https://github.com/Bobosky2005/hkjc-api) 存取未正式公開支援的 HKJC GraphQL 介面，將回應正規化為版本化 JSON 快照。

> `hkjc-api` 的 MIT 授權只適用於套件程式碼，不代表 HKJC 上游資料可自由擷取、再發布或商業使用。使用前必須自行審閱 HKJC 條款、請求頻率、資料權利及所在地法規。本文件不是法律意見。

## 安全設計

- 連接器沒有 `--enable-experimental` 時拒絕任何網絡請求。
- 預設輸出只可位於 Git 忽略的 `/.local-research/`。
- 瀏覽器不直接呼叫 HKJC 或第三方 GraphQL 端點。
- GitHub Actions 不安裝或執行此連接器。
- 公開前端匯出需要額外的 `--confirm-publication-reviewed` 確認。
- 前端預設 `VITE_ENABLE_RECENT_RACES=false`；沒有快照時顯示停用／空白狀態，不會使用模擬資料代替。
- 快照明確標示 `official_api: false` 與 `license_status: review-required`。

## 安裝

從專案根目錄執行：

```powershell
npm ci --prefix tools/recent-races
```

依賴固定為 `hkjc-api@1.0.5`。此工具與前端套件隔離，不會被 Vite 打包到瀏覽器。

## 取得本機快照

```powershell
npm run fetch --prefix tools/recent-races -- --enable-experimental
```

預設產出：

```text
.local-research/
└── recent-races/
    └── snapshots/
        └── latest.json
```

連接器會記錄：

- schema 與 connector 版本
- UTC 擷取時間
- 上游回應 SHA-256
- 來源與非官方狀態
- 最新 meeting 日期及新鮮度
- meeting、race、runner 與可用賽果欄位

連接器只保留 `ST`（沙田）與 `HV`（跑馬地）本地 meeting，並排除 `S1` 等海外 simulcast。上游只返回目前可用的 meeting；休賽期或沒有開放本地賽事時，成功快照可以包含零個 meeting。這不是錯誤，也不能以舊資料或模擬資料填補。

## 本機前端預覽

只有在完成資料權利和內容審閱後，才建立前端快照：

```powershell
npm run fetch --prefix tools/recent-races -- --enable-experimental --export-frontend --confirm-publication-reviewed
```

這會寫入 Git 忽略的：

```text
frontend/public/data/recent-races.snapshot.json
```

建立 `frontend/.env.local`（它已被 Git 忽略）：

```dotenv
VITE_ENABLE_RECENT_RACES=true
VITE_RECENT_RACES_SNAPSHOT_URL=data/recent-races.snapshot.json
```

然後執行單次生產建置驗證：

```powershell
npm run build --prefix frontend
```

`VITE_*` 變數會公開至瀏覽器，不可放入 API key、cookie 或其他祕密。

## 前端狀態

Recent Races 工作區會區分：

| 狀態 | 意義 |
|---|---|
| Disabled | 功能旗標停用，不發出請求 |
| Loading | 正在讀取及驗證快照 |
| Unavailable | 檔案不存在、HTTP 錯誤或網絡失敗 |
| Invalid | schema／來源聲明不符合 v1 合約 |
| Empty | 連接器成功，但上游沒有 meeting |
| Ready | 顯示經正規化的 meeting、race 和 runner 資料 |
| Stale | 快照可讀，但 meeting 日期超出新鮮度門檻 |

資料合約位於 [`schemas/recent-races.snapshot.schema.json`](schemas/recent-races.snapshot.schema.json)。前端只接受 `schema_version: 1.0.0`、`official_api: false` 及 `license_status: review-required` 的快照。

## GitHub Pages 限制

公開網站是靜態 GitHub Pages：

- 不能安全保存供應商祕密。
- 不能持續執行連接器或後端。
- 正常 Actions 建置不包含被忽略的本機快照。
- 因此公開網站預設會顯示 Recent Races 已停用。

如要正式公開近期資料，應先取得明確授權，改用獨立後端或經審批的資料發布流程，並加入請求限速、重試、監控、資料保留政策及供應商 SLA。

## 與歷史研究資料的分別

- [`RESEARCH_DATA.md`](RESEARCH_DATA.md)：固定至 2018 年的第三方歷史資料，用於本機回測。
- 本文件：實驗性近期 meeting 快照，不是歷史 archive，也不是授權即時 feed。
- Race Lab：仍是明確標示的模擬賽日分析。
- Live Monitor：在取得合法即時供應商與後端前維持 offline。
