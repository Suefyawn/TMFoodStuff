"""Compare restored row counts with the export's counts.json, and the files in the tar.

Usage: compare-counts.py counts.json restored.tsv <files extracted> <bytes extracted>
Prints table names, counts and PASS or FAIL only (public log). Exit 1 on any mismatch.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from counts import read_counts  # noqa: E402


def compare(expected, restored, files, size):
    rows, ok = [], True
    for name in sorted(set(expected["tables"]) | set(restored)):
        want, got = expected["tables"].get(name), restored.get(name)
        good = want is not None and want == got
        ok &= good
        rows.append((name, "-" if want is None else want, "missing" if got is None else got, "PASS" if good else "FAIL"))
    for label, key, got in (("storage objects vs files", "storage_public_objects", files),
                            ("files.tar.gz files", "storage_files", files),
                            ("files.tar.gz bytes", "storage_bytes", size)):
        want = expected.get(key)
        good = want is not None and want == got
        ok &= good
        rows.append((label, "-" if want is None else want, got, "PASS" if good else "FAIL"))
    return ok, rows


if __name__ == "__main__":
    expected = json.load(open(sys.argv[1], encoding="utf-8"))
    ok, rows = compare(expected, read_counts(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]))
    lines = ["| table | export | restored | result |", "|---|---|---|---|"] + [f"| {a} | {b} | {c} | {d} |" for a, b, c, d in rows]
    lines.append("")
    lines.append(f"Export check: {'PASS' if ok else 'FAIL'}")
    print("\n".join(lines))
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
    sys.exit(0 if ok else 1)
