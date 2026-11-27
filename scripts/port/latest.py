"""Print supabase/latest.json: the export folder and the parts of each file.

Usage: latest.py <prefix> <out_dir> <parts_dir>
"""
import datetime
import json
import os
import sys

prefix, out_dir, parts_dir = sys.argv[1:4]
files = {}
for name in sorted(os.listdir(out_dir)):
    parts = sorted(p for p in os.listdir(parts_dir) if p.startswith(name + ".part-"))
    if not parts:
        sys.exit(f"::error::no parts for {name}")
    files[name] = {"bytes": os.path.getsize(os.path.join(out_dir, name)), "parts": parts}
print(json.dumps({
    "prefix": prefix,
    "ranAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "files": files,
}, indent=1))
