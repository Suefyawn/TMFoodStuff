"""Download every object of the public storage buckets into <dest>/<bucket>/<name>.

Usage: fetch-storage.py objects.tsv dest   (objects.tsv: bucket TAB public TAB name)
Public log: prints bucket ids and counts only, never object names. A private bucket stops the
job with its id: it needs the service role key, which this workflow does not hold.
"""
import os
import sys
import time
import urllib.request
from urllib.parse import quote


def read_objects(path):
    rows = []
    for raw in open(path, encoding="utf-8"):
        raw = raw.rstrip("\n")
        if not raw:
            continue
        parts = raw.split("\t", 2)
        if len(parts) != 3:
            sys.exit("::error::unexpected line in the objects list")
        rows.append((parts[0], parts[1] == "true", parts[2]))
    return rows


def safe_target(dest, bucket, name):
    if not bucket or bucket in (".", "..") or "/" in bucket or "\\" in bucket:
        return None
    target = os.path.normpath(os.path.join(dest, bucket, name))
    root = os.path.normpath(os.path.join(dest, bucket))
    if not target.startswith(root + os.sep):
        return None
    return target


def fetch(url, target, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "tmf-ops-export"}), timeout=60) as r:
                data = r.read()
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as f:
                f.write(data)
            return True
        except Exception:  # any network or read error; never echo the URL or name
            time.sleep(2 * (i + 1))
    return False


def main(objects_path, dest, base):
    rows = read_objects(objects_path)
    private = sorted({b for b, pub, _ in rows if not pub})
    if private:
        sys.exit(f"::error::private bucket(s) need the service role key: {', '.join(private)}")
    os.makedirs(dest, exist_ok=True)
    per_bucket, failed = {}, 0
    for bucket, _, name in rows:
        target = safe_target(dest, bucket, name)
        url = f"{base}/storage/v1/object/public/{quote(bucket, safe='')}/{quote(name, safe='/')}"
        if target is None or not fetch(url, target):
            failed += 1
            continue
        per_bucket[bucket] = per_bucket.get(bucket, 0) + 1
    for b in sorted(per_bucket):
        print(f"{b}: {per_bucket[b]} files")
    print(f"objects listed: {len(rows)}, downloaded: {sum(per_bucket.values())}, failed: {failed}")
    if failed:
        sys.exit(f"::error::{failed} storage object(s) could not be downloaded")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], os.environ["SUPABASE_URL"])
