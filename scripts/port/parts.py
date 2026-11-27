"""Read supabase/latest.json.

parts.py latest.json                     print the prefix, then one 'file TAB part' line per part
parts.py latest.json --join parts_dir out_dir   join each file's parts and check its size
"""
import json
import os
import re
import sys

meta = json.load(open(sys.argv[1], encoding="utf-8"))
prefix = meta.get("prefix", "")
if not re.fullmatch(r"\d{4}-\d{2}-\d{2}-\d+", prefix):
    sys.exit("::error::bad prefix in latest.json")
files = meta.get("files", {})
want = {"tmf.dump", "tmf-schema.sql", "counts.json", "files.tar.gz"}
if set(files) != want:
    sys.exit("::error::latest.json does not list the four export files")
for name, f in files.items():
    for p in f["parts"]:
        if not re.fullmatch(re.escape(name) + r"\.part-\d{3}", p):
            sys.exit("::error::bad part name in latest.json")

if len(sys.argv) == 2:
    print(prefix)
    for name in sorted(files):
        for p in files[name]["parts"]:
            print(f"{name}\t{p}")
else:
    parts_dir, out_dir = sys.argv[3], sys.argv[4]
    for name in sorted(files):
        with open(os.path.join(out_dir, name), "wb") as out:
            for p in files[name]["parts"]:
                with open(os.path.join(parts_dir, p), "rb") as src:
                    while chunk := src.read(1 << 20):
                        out.write(chunk)
        got = os.path.getsize(os.path.join(out_dir, name))
        if got != files[name]["bytes"]:
            sys.exit(f"::error::{name} is {got} bytes after joining, expected {files[name]['bytes']}")
