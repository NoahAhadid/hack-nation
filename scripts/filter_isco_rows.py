#!/usr/bin/env python3
"""Filter CSV to keep only rows with 'ISCO' in the occupation column."""

import csv
import sys
from pathlib import Path


def filter_isco_rows(input_path: Path, output_path: Path, backup: bool = True):
    """Keep only rows that contain 'ISCO' in the occupation column."""
    
    with input_path.open('r', newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        if not reader.fieldnames:
            raise ValueError("CSV has no header row.")
        
        fieldnames = list(reader.fieldnames)
        
        # Find occupation column - could be named differently
        occupation_col = None
        for col in ['Occupation', 'ISCOCode', 'classif2.label']:
            if col in fieldnames:
                occupation_col = col
                break
        
        if not occupation_col:
            raise ValueError(f"Could not find occupation column. Available columns: {fieldnames}")
        
        rows = list(reader)
    
    # Filter rows that contain 'ISCO'
    filtered_rows = [row for row in rows if 'ISCO' in row.get(occupation_col, '')]
    
    # Create backup if requested and overwriting input
    if backup and input_path.resolve() == output_path.resolve():
        backup_path = input_path.with_suffix(input_path.suffix + '.bak')
        import shutil
        shutil.copy2(input_path, backup_path)
        print(f"Created backup: {backup_path}")
    
    # Write filtered data
    with output_path.open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(filtered_rows)
    
    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    print(f"Occupation column: {occupation_col}")
    print(f"Rows before: {len(rows)}")
    print(f"Rows after: {len(filtered_rows)}")
    print(f"Rows removed: {len(rows) - len(filtered_rows)}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python filter_isco_rows.py <input_file> [output_file]")
        print("\nIf output_file is not specified, input will be overwritten (with backup).")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else input_file
    
    filter_isco_rows(input_file, output_file)
