"""Set SUPABASE_URL for later steps without printing it.

Order: the SUPABASE_URL_INPUT env (workflow input or repo variable), else the project ref in
SUPABASE_DB_URL: pooler user "postgres.<ref>" or direct host "db.<ref>.supabase.co".
"""
import os
import re
import sys
from urllib.parse import urlparse


def project_url(given, db_url):
    if given:
        given = given.strip().rstrip("/")
        if not re.fullmatch(r"https://[a-z0-9]{10,40}\.supabase\.co", given):
            raise ValueError("supabase_url must look like https://<ref>.supabase.co")
        return given
    u = urlparse(db_url)
    user = u.username or ""
    host = u.hostname or ""
    m = re.fullmatch(r"postgres\.([a-z0-9]{10,40})", user) or re.fullmatch(r"db\.([a-z0-9]{10,40})\.supabase\.co", host)
    if not m:
        raise ValueError("could not work out the project ref from SUPABASE_DB_URL; set the SUPABASE_URL repo variable")
    return f"https://{m.group(1)}.supabase.co"


if __name__ == "__main__":
    try:
        url = project_url(os.environ.get("SUPABASE_URL_INPUT", ""), os.environ.get("DB_URL", ""))
    except ValueError as e:
        sys.exit(f"::error::{e}")
    print(f"::add-mask::{url}")
    with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as f:
        f.write(f"SUPABASE_URL={url}\n")
    print("Project URL set (masked)")
