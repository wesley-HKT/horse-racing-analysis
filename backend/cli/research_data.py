"""Commands for local-only historical research data.

Examples:
    python -m backend.cli.research_data download
    python -m backend.cli.research_data import
    python -m backend.cli.research_data backtest
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from backend.research_pipeline import (
    download_source,
    import_hong_kong_performances,
    inspect_source,
    research_root,
    run_historical_baseline_backtest,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="香港賽馬歷史研究資料工具（本機限定）")
    parser.add_argument(
        "--research-dir",
        help="本機研究資料目錄；預設為專案根目錄下的 .local-research",
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    download = subcommands.add_parser("download", help="下載或驗證固定的研究資料來源")
    download.add_argument("--refresh", action="store_true", help="明確要求更新既有 checkout")
    subcommands.add_parser("inspect", help="產生來源版本、雜湊與欄位清單")
    subcommands.add_parser("import", help="匯入香港賽果至本機 SQLite")
    subcommands.add_parser("backtest", help="執行無前視偏差的歷史基準回測")
    subcommands.add_parser("all", help="依序下載、檢查、匯入並回測")
    return parser


def emit(payload: object) -> None:
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def main() -> int:
    arguments = build_parser().parse_args()
    root: Path = research_root(arguments.research_dir)

    if arguments.command == "download":
        checkout = download_source(root, refresh=arguments.refresh)
        emit({"source_checkout": str(checkout), "research_root": str(root)})
        return 0
    if arguments.command == "inspect":
        emit(inspect_source(root))
        return 0
    if arguments.command == "import":
        emit(import_hong_kong_performances(root))
        return 0
    if arguments.command == "backtest":
        emit(run_historical_baseline_backtest(root))
        return 0

    download_source(root)
    manifest = inspect_source(root)
    imported = import_hong_kong_performances(root)
    backtest = run_historical_baseline_backtest(root)
    emit({"manifest": manifest, "import": imported, "backtest": backtest})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
