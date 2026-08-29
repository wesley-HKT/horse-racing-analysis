"""Local-only historical research pipeline for the selected HK horse-racing dataset.

This module deliberately keeps source data, the SQLite database, and every generated
report below an ignored local directory. It never exposes raw records through a web API.
"""

from __future__ import annotations

import csv
import gzip
import hashlib
import json
import os
import sqlite3
import subprocess
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterator

SOURCE_REPOSITORY = "https://github.com/eprochasson/horserace_data.git"
SOURCE_DIRECTORY_NAME = "horserace_data"
PERFORMANCES_FILENAME = "performances.csv.gz"
REQUIRED_PERFORMANCE_COLUMNS = {
    "horse_id",
    "horse_name",
    "race_date",
    "race_country",
    "race_no",
    "final_placing",
    "jockey_name",
    "trainer_name",
    "winning_odds",
    "actual_weight",
    "draw",
    "distance",
    "track",
}


def repository_root() -> Path:
    return Path(__file__).resolve().parents[1]


def research_root(value: str | None = None) -> Path:
    configured = value or os.getenv("HORSE_RACING_RESEARCH_DIR")
    root = Path(configured).expanduser() if configured else repository_root() / ".local-research"
    root = root.resolve()
    public_directory = (repository_root() / "frontend" / "public").resolve()
    if root == repository_root() or root == public_directory or public_directory in root.parents:
        raise ValueError("研究資料目錄不可為專案根目錄或前端公開資產目錄")
    return root


def source_root(root: Path) -> Path:
    return root / "upstream" / SOURCE_DIRECTORY_NAME


def _run_git(arguments: list[str], cwd: Path | None = None) -> str:
    completed = subprocess.run(
        ["git", *arguments],
        cwd=cwd,
        check=True,
        text=True,
        capture_output=True,
    )
    return completed.stdout.strip()


def download_source(root: Path, refresh: bool = False) -> Path:
    """Clone the fixed source repository locally, or refresh it when explicitly requested."""
    destination = source_root(root)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if not (destination / ".git").is_dir():
            raise RuntimeError(f"來源目錄不是 Git checkout：{destination}")
        if refresh:
            _run_git(["pull", "--ff-only"], cwd=destination)
        return destination

    _run_git(["clone", "--depth", "1", SOURCE_REPOSITORY, str(destination)])
    return destination


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_source(root: Path) -> dict[str, Any]:
    """Return a reproducibility manifest without copying or exposing raw records."""
    checkout = source_root(root)
    data_directory = checkout / "data"
    if not data_directory.is_dir():
        raise FileNotFoundError(f"找不到來源資料目錄：{data_directory}")

    files: dict[str, dict[str, Any]] = {}
    for dataset in sorted(data_directory.glob("*.csv.gz")):
        with gzip.open(dataset, "rt", encoding="utf-8", newline="") as handle:
            reader = csv.reader(handle)
            header = next(reader, [])
        files[dataset.name] = {
            "bytes": dataset.stat().st_size,
            "sha256": _sha256(dataset),
            "columns": header,
        }

    commit = _run_git(["rev-parse", "HEAD"], cwd=checkout)
    manifest = {
        "source_repository": SOURCE_REPOSITORY,
        "source_commit": commit,
        "retrieved_at_utc": datetime.now(UTC).isoformat(),
        "files": files,
    }
    provenance = root / "provenance.json"
    provenance.parent.mkdir(parents=True, exist_ok=True)
    provenance.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def _as_int(value: str | None) -> int | None:
    try:
        return int((value or "").strip())
    except ValueError:
        return None


def _as_float(value: str | None) -> float | None:
    try:
        return float((value or "").strip())
    except ValueError:
        return None


def _race_date(value: str | None) -> str | None:
    candidate = (value or "")[:10]
    try:
        return datetime.strptime(candidate, "%Y-%m-%d").date().isoformat()
    except ValueError:
        return None


def _race_key(row: dict[str, str], race_date: str, race_number: int) -> str:
    explicit_id = (row.get("race_id") or "").strip()
    if explicit_id:
        return explicit_id
    return "|".join(
        [
            race_date,
            str(race_number),
            (row.get("race_location") or "").strip(),
            (row.get("course") or "").strip(),
            (row.get("distance") or "").strip(),
        ]
    )


def _create_normalized_database(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        DROP TABLE IF EXISTS runners;
        CREATE TABLE runners (
            race_key TEXT NOT NULL,
            race_date TEXT NOT NULL,
            race_number INTEGER NOT NULL,
            horse_id TEXT NOT NULL,
            horse_name TEXT NOT NULL,
            jockey_name TEXT,
            trainer_name TEXT,
            draw INTEGER,
            actual_weight REAL,
            winning_odds REAL,
            finish_position INTEGER NOT NULL,
            distance INTEGER,
            track TEXT,
            going TEXT,
            race_class TEXT,
            source_commit TEXT NOT NULL
        );
        CREATE INDEX runners_race_index ON runners (race_date, race_number, race_key);
        CREATE INDEX runners_horse_index ON runners (horse_id, race_date);
        """
    )


def import_hong_kong_performances(root: Path) -> dict[str, Any]:
    """Normalize verified Hong Kong performance rows into local SQLite.

    Invalid or incomplete outcomes are skipped instead of guessed. No raw source
    rows are copied outside the ignored research directory.
    """
    manifest = inspect_source(root)
    source_file = source_root(root) / "data" / PERFORMANCES_FILENAME
    if not source_file.is_file():
        raise FileNotFoundError(f"找不到表現資料：{source_file}")

    imports_directory = root / "imports"
    reports_directory = root / "reports"
    imports_directory.mkdir(parents=True, exist_ok=True)
    reports_directory.mkdir(parents=True, exist_ok=True)
    database_path = imports_directory / "normalized.sqlite"
    if database_path.exists():
        database_path.unlink()

    inserted = 0
    skipped = defaultdict(int)
    minimum_date: str | None = None
    maximum_date: str | None = None
    batch: list[tuple[Any, ...]] = []

    with sqlite3.connect(database_path) as connection:
        _create_normalized_database(connection)
        with gzip.open(source_file, "rt", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            columns = set(reader.fieldnames or [])
            missing = REQUIRED_PERFORMANCE_COLUMNS - columns
            if missing:
                raise ValueError(f"來源欄位不符合預期，缺少：{', '.join(sorted(missing))}")

            for row in reader:
                if (row.get("race_country") or "").strip().upper() != "HK":
                    skipped["non_hong_kong"] += 1
                    continue
                date = _race_date(row.get("race_date"))
                position = _as_int(row.get("final_placing"))
                race_number = _as_int(row.get("race_no"))
                horse_id = (row.get("horse_id") or "").strip()
                horse_name = (row.get("horse_name") or "").strip()
                if not date or position is None or position < 1 or not race_number or not horse_id or not horse_name:
                    skipped["missing_required_result"] += 1
                    continue

                batch.append(
                    (
                        _race_key(row, date, race_number),
                        date,
                        race_number,
                        horse_id,
                        horse_name,
                        (row.get("jockey_name") or "").strip() or None,
                        (row.get("trainer_name") or "").strip() or None,
                        _as_int(row.get("draw")),
                        _as_float(row.get("actual_weight")),
                        _as_float(row.get("winning_odds")),
                        position,
                        _as_int(row.get("distance")),
                        (row.get("track") or "").strip() or None,
                        (row.get("going") or "").strip() or None,
                        (row.get("race_class") or "").strip() or None,
                        manifest["source_commit"],
                    )
                )
                minimum_date = date if minimum_date is None else min(minimum_date, date)
                maximum_date = date if maximum_date is None else max(maximum_date, date)
                if len(batch) >= 2_000:
                    connection.executemany(
                        "INSERT INTO runners VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        batch,
                    )
                    inserted += len(batch)
                    batch.clear()

            if batch:
                connection.executemany(
                    "INSERT INTO runners VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    batch,
                )
                inserted += len(batch)
        race_count = connection.execute("SELECT COUNT(DISTINCT race_key) FROM runners").fetchone()[0]
    connection.close()

    report = {
        "source_commit": manifest["source_commit"],
        "dataset": PERFORMANCES_FILENAME,
        "database_path": str(database_path),
        "runners_imported": inserted,
        "races_imported": race_count,
        "period": {"start": minimum_date, "end": maximum_date},
        "skipped": dict(skipped),
        "generated_at_utc": datetime.now(UTC).isoformat(),
        "warning": "研究用途的本機正規化資料；不可視為即時資料或投注建議。",
    }
    (reports_directory / "import-summary.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return report


def _group_rows(rows: Iterator[sqlite3.Row]) -> Iterator[list[sqlite3.Row]]:
    current_key: str | None = None
    group: list[sqlite3.Row] = []
    for row in rows:
        key = row["race_key"]
        if current_key is not None and key != current_key:
            yield group
            group = []
        current_key = key
        group.append(row)
    if group:
        yield group


def run_historical_baseline_backtest(root: Path) -> dict[str, Any]:
    """Run a chronological no-look-ahead win-rate baseline against local results.

    Each runner's score uses only the same horse's results from earlier races. Odds
    are deliberately excluded because final odds are not a pre-race model feature.
    """
    database_path = root / "imports" / "normalized.sqlite"
    if not database_path.is_file():
        raise FileNotFoundError("尚未匯入資料；請先執行 import 子命令")

    history: dict[str, dict[str, int]] = defaultdict(lambda: {"starts": 0, "wins": 0})
    evaluated_races = 0
    total_runners = 0
    top1_hits = 0
    top3_hits = 0
    skipped_untrained = 0
    period_start: str | None = None
    period_end: str | None = None

    with sqlite3.connect(database_path) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(
            """
            SELECT race_key, race_date, race_number, horse_id, draw, finish_position
            FROM runners
            ORDER BY race_date, race_number, race_key
            """
        )
        for race in _group_rows(iter(cursor)):
            race_date = race[0]["race_date"]
            period_start = race_date if period_start is None else min(period_start, race_date)
            period_end = race_date if period_end is None else max(period_end, race_date)
            has_winner = any(row["finish_position"] == 1 for row in race)
            has_history = any(history[row["horse_id"]]["starts"] >= 3 for row in race)
            if len(race) >= 3 and has_winner and has_history:
                ranked = sorted(
                    race,
                    key=lambda row: (
                        -((history[row["horse_id"]]["wins"] + 1) / (history[row["horse_id"]]["starts"] + 10)),
                        row["draw"] if row["draw"] is not None else 99,
                        row["horse_id"],
                    ),
                )
                evaluated_races += 1
                total_runners += len(race)
                top1_hits += int(ranked[0]["finish_position"] == 1)
                top3_hits += int(any(row["finish_position"] == 1 for row in ranked[:3]))
            else:
                skipped_untrained += 1

            for row in race:
                horse = history[row["horse_id"]]
                horse["starts"] += 1
                horse["wins"] += int(row["finish_position"] == 1)
    connection.close()

    metrics = {
        "evaluated_races": evaluated_races,
        "evaluated_runners": total_runners,
        "top_1_winner_hit_rate": round(top1_hits / evaluated_races, 4) if evaluated_races else None,
        "top_3_contains_winner_rate": round(top3_hits / evaluated_races, 4) if evaluated_races else None,
        "skipped_before_minimum_history": skipped_untrained,
    }
    report = {
        "baseline": "chronological horse historical win-rate with Beta(1, 9) smoothing",
        "feature_policy": "每場評分只使用同一匹馬於較早賽事的成績；不使用最終賠率或當場結果。",
        "period": {"start": period_start, "end": period_end},
        "metrics": metrics,
        "generated_at_utc": datetime.now(UTC).isoformat(),
        "limitations": [
            "此為研究基準，並非已訓練的預測模型。",
            "資料集最晚紀錄於 2018 年，不能代表現況或即時賽事。",
            "本回測不計算投注回報或提供投注建議。",
        ],
    }
    reports_directory = root / "reports"
    reports_directory.mkdir(parents=True, exist_ok=True)
    (reports_directory / "backtest-summary.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return report


RESEARCH_SUMMARY_SCHEMA_VERSION = "1.0.0"


def build_frontend_research_summary(root: Path) -> dict[str, Any]:
    """Build a versioned frontend-safe research summary from local reports.

    The export only contains aggregated metrics and provenance metadata. Raw records
    never leave the ignored local research directory.
    """
    import_summary_path = root / "reports" / "import-summary.json"
    backtest_summary_path = root / "reports" / "backtest-summary.json"
    if not import_summary_path.is_file():
        raise FileNotFoundError("尚未匯入資料；請先執行 import 子命令")
    if not backtest_summary_path.is_file():
        raise FileNotFoundError("尚未執行回測；請先執行 backtest 子命令")

    import_summary = json.loads(import_summary_path.read_text(encoding="utf-8"))
    backtest_summary = json.loads(backtest_summary_path.read_text(encoding="utf-8"))
    metrics = backtest_summary.get("metrics", {})
    top_one = metrics.get("top_1_winner_hit_rate")
    top_three = metrics.get("top_3_contains_winner_rate")
    if top_one is None or top_three is None:
        raise RuntimeError("回測摘要缺少必要的命中率指標")

    period = backtest_summary.get("period") or import_summary.get("period") or {}
    start = period.get("start")
    end = period.get("end")
    if not start or not end:
        raise RuntimeError("回測摘要缺少資料期間")

    return {
        "schema_version": RESEARCH_SUMMARY_SCHEMA_VERSION,
        "generated_at_utc": datetime.now(UTC).isoformat(),
        "data_status": "verified",
        "source": {
            "provider": SOURCE_REPOSITORY,
            "source_commit": str(import_summary.get("source_commit") or ""),
            "official_api": False,
            "license_status": "review-required",
        },
        "metrics": {
            "records": int(import_summary.get("runners_imported") or 0),
            "races": int(import_summary.get("races_imported") or 0),
            "top_one_hit_rate": float(top_one),
            "top_three_hit_rate": float(top_three),
            "period": {"start": str(start), "end": str(end)},
        },
        "baseline": str(backtest_summary.get("baseline") or ""),
        "limitations": list(backtest_summary.get("limitations") or []),
    }


def export_frontend_research_summary(root: Path, destination: Path | None = None) -> dict[str, Any]:
    """Write the frontend research summary to the local reports directory."""
    summary = build_frontend_research_summary(root)
    reports_directory = root / "reports"
    reports_directory.mkdir(parents=True, exist_ok=True)
    report_path = reports_directory / "frontend-research-summary.json"
    report_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    if destination is not None:
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "summary": summary,
        "report_path": str(report_path),
        "frontend_path": str(destination) if destination is not None else None,
    }
