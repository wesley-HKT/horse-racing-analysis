from __future__ import annotations

import csv
import gzip
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.research_pipeline import (
    import_hong_kong_performances,
    inspect_source,
    run_historical_baseline_backtest,
)


class ResearchPipelineTests(unittest.TestCase):
    def make_source(self, root: Path) -> None:
        checkout = root / "upstream" / "horserace_data"
        data = checkout / "data"
        data.mkdir(parents=True)
        subprocess.run(["git", "init", "-q"], cwd=checkout, check=True)
        headers = [
            "horse_id", "horse_name", "race_no", "race_id", "race_date", "race_country",
            "final_placing", "jockey_name", "trainer_name", "winning_odds", "actual_weight",
            "draw", "distance", "track", "going", "race_class", "race_location", "course",
        ]
        rows = []
        for race_number in range(1, 7):
            for horse_number, horse_id in enumerate(("A", "B", "C"), start=1):
                rows.append({
                    "horse_id": horse_id,
                    "horse_name": f"Horse {horse_id}",
                    "race_no": str(race_number),
                    "race_id": f"R{race_number}",
                    "race_date": f"2018-01-{race_number:02d} 00:00:00.000000",
                    "race_country": "HK",
                    "final_placing": str(1 if horse_id == "A" else horse_number),
                    "jockey_name": "Jockey", "trainer_name": "Trainer", "winning_odds": "3.0",
                    "actual_weight": "55", "draw": str(horse_number), "distance": "1200",
                    "track": "Turf", "going": "Good", "race_class": "4",
                    "race_location": "ST", "course": "A",
                })
        with gzip.open(data / "performances.csv.gz", "wt", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
        subprocess.run(["git", "add", "."], cwd=checkout, check=True)
        subprocess.run(
            ["git", "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "fixture"],
            cwd=checkout,
            check=True,
        )

    def test_import_and_chronological_backtest(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.make_source(root)
            manifest = inspect_source(root)
            self.assertIn("performances.csv.gz", manifest["files"])
            imported = import_hong_kong_performances(root)
            self.assertEqual(imported["runners_imported"], 18)
            self.assertEqual(imported["races_imported"], 6)
            report = run_historical_baseline_backtest(root)
            self.assertGreater(report["metrics"]["evaluated_races"], 0)
            self.assertIsNotNone(report["metrics"]["top_1_winner_hit_rate"])


if __name__ == "__main__":
    unittest.main()
