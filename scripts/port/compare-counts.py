"""Compare restored row counts with the export's counts.json, and the files in the tar.

Usage: compare-counts.py counts.json restored.tsv <files in tar>
Prints table names, counts and PASS or FAIL only (public log). Exit 1 on any mismatch.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from counts import read_counts  # noqa: E402


def compare(expected, restored, files):
    rows, ok = [], True
    for name in sorted(set(expected["tables"]) | set(restored)):
        want, got = expected["tables"].get(name), restored.get(name)
        good = want is not None and want == got
        ok &= good
        rows.append((name, "-" if want is None else want, "missing" if got is None else got, "PASS" if good else "FAIL"))
    want_files = expected.get("storage_public_objects")
    good = want_files is not None and want_files == files
    ok &= good
    rows.append(("files.tar.gz files", "-" if want_files is None else want_files, files, "PASS" if good else "FAIL"))
    return ok, rows


if __name__ == "__main__":
    expected = json.load(open(sys.argv[1], encoding="utf-8"))
    ok, rows = compare(expected, read_counts(sys.argv[2]), int(sys.argv[3] or 0))
    lines = ["| table | export | restored | result |", "|---|---|---|---|"] + [f"| {a} | {b} | {c} | {d} |" for a, b, c, d in rows]
    lines.append("")
    lines.append(f"Export check: {'PASS' if ok else 'FAIL'}")
    print("\n".join(lines))
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
    sys.exit(0 if ok else 1)
