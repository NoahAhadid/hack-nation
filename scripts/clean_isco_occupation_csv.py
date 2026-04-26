#!/usr/bin/env python3
"""Clean ILO occupation CSVs to ISCO-08 1-digit major groups.

The input file from ILOSTAT can mix multiple occupation classifications in one
column, such as skill-level summaries, ISCO-88 rows, ISCO-08 totals, and ISCO-08
major groups. This script keeps only valid ISCO-08 1-digit major-group rows and
adds normalized major-group columns for downstream matching.
"""

from __future__ import annotations

import argparse
import csv
import re
import shutil
from collections import Counter
from pathlib import Path


DEFAULT_INPUT = (
    "ESCO dataset - v1.2.1 - classification - en - csv/ISCO/"
    "EMP_TEMP_SEX_AGE_OCU_NB_A-filtered-2026-04-26.csv"
)

ISCO_08_MAJOR_LABELS = {
    "0": "Armed forces occupations",
    "1": "Managers",
    "2": "Professionals",
    "3": "Technicians and associate professionals",
    "4": "Clerical support workers",
    "5": "Service and sales workers",
    "6": "Skilled agricultural, forestry and fishery workers",
    "7": "Craft and related trades workers",
    "8": "Plant and machine operators, and assemblers",
    "9": "Elementary occupations",
}

ISCO_08_MAJOR_RE = re.compile(r"^Occupation \(ISCO-08\): ([0-9])\. (.+?)\s*$")


def find_occupation_column(fieldnames: list[str]) -> str:
    """Return the occupation-like column used by the CSV."""
    candidates = ["Occupation", "classif2.label"]

    for candidate in candidates:
        if candidate in fieldnames:
            return candidate

    raise ValueError(
        "Could not find an occupation column. Expected one of: "
        + ", ".join(candidates)
    )


def parse_isco_08_major(occupation: str) -> tuple[str, str] | None:
    """Return (major_code, canonical_label) for valid ISCO-08 1-digit rows."""
    match = ISCO_08_MAJOR_RE.match(occupation.strip())

    if not match:
        return None

    code = match.group(1)
    label = ISCO_08_MAJOR_LABELS.get(code)

    if not label:
        return None

    return code, label


def clean_csv(input_path: Path, output_path: Path, create_backup: bool) -> None:
    with input_path.open("r", newline="", encoding="utf-8-sig") as input_file:
        reader = csv.DictReader(input_file)

        if not reader.fieldnames:
            raise ValueError("CSV has no header row.")

        fieldnames = list(reader.fieldnames)
        occupation_column = find_occupation_column(fieldnames)
        rows = list(reader)

    added_fields = [
        "isco_08_major_code",
        "isco_08_major_label",
        "isco_08_major_group",
    ]
    output_fieldnames = fieldnames + [
        field for field in added_fields if field not in fieldnames
    ]
    cleaned_rows: list[dict[str, str]] = []
    removed_counts: Counter[str] = Counter()
    major_counts: Counter[str] = Counter()

    for row in rows:
        occupation = row.get(occupation_column, "")
        major = parse_isco_08_major(occupation)

        if not major:
            if "ISCO-08" not in occupation:
                removed_counts["not_isco_08"] += 1
            elif "Total" in occupation:
                removed_counts["isco_08_total"] += 1
            elif "Not elsewhere classified" in occupation:
                removed_counts["isco_08_not_elsewhere_classified"] += 1
            else:
                removed_counts["other_non_major"] += 1

            continue

        major_code, major_label = major
        row["isco_08_major_code"] = major_code
        row["isco_08_major_label"] = major_label
        row["isco_08_major_group"] = f"{major_code}. {major_label}"
        cleaned_rows.append(row)
        major_counts[row["isco_08_major_group"]] += 1

    if create_backup and input_path.resolve() == output_path.resolve():
        backup_path = input_path.with_suffix(input_path.suffix + ".bak")
        shutil.copy2(input_path, backup_path)

    with output_path.open("w", newline="", encoding="utf-8-sig") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=output_fieldnames)
        writer.writeheader()
        writer.writerows(cleaned_rows)

    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    print(f"Occupation column: {occupation_column}")
    print(f"Rows before: {len(rows)}")
    print(f"Rows after: {len(cleaned_rows)}")
    print(f"Rows removed: {len(rows) - len(cleaned_rows)}")
    print("Removed row types:")
    for key, count in removed_counts.most_common():
        print(f"  {key}: {count}")
    print("ISCO-08 1-digit major groups:")
    for group in sorted(major_counts):
        print(f"  {group}: {major_counts[group]}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Keep only ISCO-08 1-digit major-group occupation rows."
    )
    parser.add_argument(
        "input",
        nargs="?",
        default=DEFAULT_INPUT,
        help="CSV to clean. Defaults to the hackathon ILOSTAT occupation CSV.",
    )
    parser.add_argument(
        "--output",
        help="Output CSV path. Defaults to overwriting the input file.",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create a .bak file when overwriting the input.",
    )
    args = parser.parse_args()

    input_path = Path(args.input).expanduser()
    output_path = Path(args.output).expanduser() if args.output else input_path

    clean_csv(input_path, output_path, create_backup=not args.no_backup)


if __name__ == "__main__":
    main()
