# RacingIQ — 香港賽馬分析研究平台

RacingIQ 是一個專業、響應式的香港賽馬分析研究介面，將**真實歷史研究結果**、**模擬賽日分析**、**實驗性近期賽事快照**與**尚未接駁的即時功能**清楚分開，避免把展示資料誤認為官方或即時賽果。

- 公開網站：https://wesley-hkt.github.io/horse-racing-analysis/
- 歷史資料流程：[RESEARCH_DATA.md](RESEARCH_DATA.md)
- 近期賽事實驗連接器：[RECENT_RACES.md](RECENT_RACES.md)

## 平台工作區

| 工作區 | 目前狀態 | 資料性質 |
|---|---|---|
| Command Centre | 可用 | 歷史聚合值 + 明確模擬賽日訊號 |
| Race Lab | 可用 | 模擬馬匹、機率及模型解釋 |
| Recent Races | 預設停用 | 本機審閱後的非官方正規化快照 |
| Backtest Studio | 可用 | 1977–2018 真實歷史研究資料 |
| Live Monitor | Offline | 尚未連接授權即時供應商 |
| Data Vault | 可用 | 資料版本、來源、品質及隔離狀態 |

## 已驗證歷史研究結果

- 香港出賽紀錄：`273,993`
- 可評估賽事：`22,731`
- 資料期間：`1977-05-07` 至 `2018-06-27`
- Top-1 勝出命中：`14.54%`
- Top-3 含冠軍：`34.85%`
- 固定來源 commit：`70b86e9944a09d89b45b74371af132d99166c35c`

這是時間順序的平滑馬匹勝率基準，不是正式生產 AI 模型、即時預測或投注回報保證。

## 實際技術結構

### 可運作部分

- React 18 + TypeScript + Vite 靜態前端
- 純 CSS 響應式設計
- GitHub Actions + GitHub Pages
- Python 標準函式庫歷史下載／檢查／SQLite 匯入／回測 CLI
- 隔離的 Node.js 實驗性近期賽事連接器

### 尚未完成

`backend/main.py` 是 FastAPI 架構草稿，仍引用未實作的 router、database、data service 和 predictor 模組，因此不能視為已部署後端。PostgreSQL、Redis、正式模型服務、WebSocket 和授權即時 feed 均未上線。

## 前端開發與驗證

需求：Node.js 20+

```powershell
npm ci --prefix frontend
npm run build --prefix frontend
```

如需本機開發伺服器，請在自己的終端執行：

```powershell
npm run dev --prefix frontend
```

Vite base 固定為 `/horse-racing-analysis/`，生產輸出位於 `frontend/dist/`。

## 歷史資料與回測

所有第三方原始資料、SQLite 與報告都留在 Git 忽略的 `/.local-research/`，不會由 GitHub Pages 發布。

```powershell
python -m backend.cli.research_data download
python -m backend.cli.research_data inspect
python -m backend.cli.research_data import
python -m backend.cli.research_data backtest
```

完整流程與授權限制請見 [RESEARCH_DATA.md](RESEARCH_DATA.md)。

## 實驗性近期賽事

免費技術路徑使用 `hkjc-api@1.0.5`，但它是非官方 wrapper；MIT 授權只覆蓋 wrapper 程式碼，不代表上游 HKJC 資料可以自由再發布。

```powershell
npm ci --prefix tools/recent-races
npm run fetch --prefix tools/recent-races -- --enable-experimental
```

連接器預設只寫入：

```text
.local-research/recent-races/snapshots/latest.json
```

它不會在 GitHub Actions 中執行，前端亦預設停用。完整安全閘門、本機預覽及資料狀態請見 [RECENT_RACES.md](RECENT_RACES.md)。

## 資料狀態原則

- `HISTORICAL`：真實但較舊的本機研究資料。
- `SIMULATION`：只用於介面及分析流程展示。
- `UNOFFICIAL / REVIEW REQUIRED`：實驗性近期快照。
- `FEED OFFLINE`：沒有授權即時資料，不顯示虛構 live 數值。

任何公開或商業資料服務前，必須確認來源條款、再利用權利、請求頻率、資料保留及供應商 SLA。本專案不構成投注建議。

## 資料隔離

```text
.local-research/                         # 全部由 Git 忽略
├── upstream/horserace_data/             # 歷史來源 checkout
├── imports/normalized.sqlite            # 歷史正規化資料
├── reports/                             # 匯入與回測摘要
└── recent-races/snapshots/latest.json   # 實驗性近期快照
```

經人工審閱的本機前端快照路徑 `frontend/public/data/recent-races.snapshot.json` 亦由 Git 忽略，不應提交原始供應商資料、cookie、API key 或憑證。

## 部署

`.github/workflows/ci-cd.yml` 在 `main` 推送後執行：

1. `npm ci`（frontend）
2. `npm run build`
3. 上傳 `frontend/dist`
4. 部署 GitHub Pages

工作流不安裝 Python、不執行近期賽事連接器，也不讀取 `.local-research/`。

## 驗證命令

```powershell
# 前端 TypeScript + Vite
npm run build --prefix frontend

# 歷史研究合成測試
python -m unittest backend.tests.test_research_pipeline -v

# 近期連接器安全閘門（預期拒絕網絡）
npm run fetch --prefix tools/recent-races
```

## License

專案程式碼採用 MIT License。第三方賽馬資料及來源網站內容不因本專案程式碼授權而獲得相同授權。
