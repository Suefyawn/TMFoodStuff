"""Turn counts.tsv (schema.table TAB count) into counts.json.

Usage: counts.py counts.tsv out.json [objects.tsv]
Prints table names and counts only (public log).
"""
import json
import sys


def read_counts(path):
    counts = {}
    for raw in open(path, encoding="utf-8"):
        raw = raw.rstrip("\n")
        if not raw:
            continue
        name, _, n = raw.rpartition("\t")
        if not name or not n.isdigit():
            sys.exit("::error::unexpected line in the counts output")
        counts[name] = int(n)
    return counts


if __name__ == "__main__":
    counts = read_counts(sys.argv[1])
    if not counts:
        sys.exit("::error::no tables counted")
    out = {"tables": counts}
    if len(sys.argv) > 3:
        # One line per storage object; the export fails on a private bucket, so all are public.
        out["storage_public_objects"] = sum(1 for line in open(sys.argv[3], encoding="utf-8") if line.strip())
    json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), indent=1, sort_keys=True)
