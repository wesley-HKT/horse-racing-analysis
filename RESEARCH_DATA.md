# 歷史研究資料與回測

本文件說明 AI 賽馬分析平台目前使用的本機研究資料流程。此功能用於資料工程與歷史回測研究，不提供即時賽事預測、投注建議或保證任何結果。

## 資料來源與範圍

研究工具固定使用 [`eprochasson/horserace_data`](https://github.com/eprochasson/horserace_data) 作為本機原始資料來源。此資料集由第三方從公開賽馬網站整理，專案本身未標示授權檔；使用者必須自行確認來源網站條款、資料再利用權利及所在地法規後才可使用。

- 原始資料不會提交、上傳或部署到本專案的 GitHub 倉庫。
- 下載資料、SQLite 正規化檔、來源雜湊和回測報告全都放在 `/.local-research/`。
- `/.local-research/` 已由 `.gitignore` 排除。
- 本次驗證來源 commit：`70b86e9944a09d89b45b74371af132d99166c35c`。
- 香港賽果資料實測範圍：1977-05-07 至 2018-06-27；它不是即時資料。

## 安裝與執行

所有命令都從專案根目錄執行。資料工具只使用 Python 標準函式庫，因此不會因下載流程額外安裝第三方套件。

```powershell
# 下載固定來源到本機忽略目錄；若已存在則只驗證既有 checkout
python -m backend.cli.research_data download

# 明確要求更新既有 checkout
python -m backend.cli.research_data download --refresh

# 記錄來源 Git commit、檔案 SHA-256、檔案大小和欄位名稱
python -m backend.cli.research_data inspect

# 只匯入香港 performance records 到本機 SQLite
python -m backend.cli.research_data import

# 執行時間順序、無前視偏差的基準回測
python -m backend.cli.research_data backtest

# 依序下載、檢查、匯入、回測
python -m backend.cli.research_data all
```

可用 `HORSE_RACING_RESEARCH_DIR` 或 CLI 的 `--research-dir` 設定不同的本機研究目錄。不要將其設為 `frontend/public`、專案根目錄或任何公開網頁資產路徑。

```powershell
$env:HORSE_RACING_RESEARCH_DIR = "D:\horse-racing-research"
python -m backend.cli.research_data all
```

## 產出檔案

```text
.local-research/
├── upstream/horserace_data/       # 第三方來源 checkout
├── provenance.json                # 固定來源 commit、雜湊、欄位
├── imports/normalized.sqlite      # 僅香港賽果的本機正規化 SQLite
└── reports/
    ├── import-summary.json
    └── backtest-summary.json
```

`normalized.sqlite` 的 `runners` 表包含賽事日期、賽事編號、馬匹、騎師、練馬師、檔位、負磅、最終賠率、名次、路程、跑道、場地狀況和班次等欄位。

## 目前回測方法

目前是可驗證資料流程的**基準模型**，不是正式 AI 預測模型：

1. 依賽事日期與賽事編號進行時間順序評估。
2. 每匹馬只用較早賽事的勝率，採用 Beta(1, 9) 平滑處理。
3. 當場最終名次不會用於該場評分；最終賠率也刻意不作為特徵，避免把賽後或市場資料誤當作可預測訊號。
4. 每場至少需三匹馬且至少一匹有三場以上歷史紀錄才會進入評估。

目前資料驗證結果：

| 指標 | 結果 |
|---|---:|
| 匯入香港出賽紀錄 | 273,993 |
| 可評估賽事 | 22,731 |
| Top-1 勝出命中率 | 14.54% |
| Top-3 含冠軍比率 | 34.85% |

上述指標僅用於檢查匯入與時間序列回測流程；它們不代表未來結果、投資／投注報酬或即時模型準確度。

## 下一步

1. 加入經授權的較新歷史資料，並固定資料版本與授權證明。
2. 建立訓練／驗證／測試的賽季切分，加入馬匹近況、騎師、練馬師、路程及場地特徵。
3. 將模型工件和資料庫部署至獨立後端服務；GitHub Pages 只能承載靜態前端。
4. 僅在取得合法即時資料供應商 API 與適當的後端祕密管理後，才可加入即時分析。

## 安全與資料保護

- 不要把 `.local-research/`、SQLite、原始 CSV、來源帳戶或 API key 加入 Git。
- 不要將來源資料放進 `frontend/public` 或 GitHub Pages 產物。
- 不要把下載指令放入 GitHub Actions，除非已確認授權、頻率限制與成本。
- 單元測試只使用程式生成的合成資料，不依賴或再散布第三方資料。
