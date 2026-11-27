"""Set SUPABASE_URL for later steps without printing it.

Worked out from the project ref in SUPABASE_DB_URL (env DB_URL): pooler user "postgres.<ref>"
or direct host "db.<ref>.supabase.co". Never taken from an input or a repo variable, since those
would show in the public log's step headers.
"""
import os
import re
import sys
from urllib.parse import urlparse


def project_url(db_url):
    u = urlparse(db_url)
    user = u.username or ""
    host = u.hostname or ""
    m = re.fullmatch(r"postgres\.([a-z0-9]{10,40})", user) or re.fullmatch(r"db\.([a-z0-9]{10,40})\.supabase\.co", host)
    if not m:
        raise ValueError("could not work out the project ref from SUPABASE_DB_URL")
    return f"https://{m.group(1)}.supabase.co"


if __name__ == "__main__":
    try:
        url = project_url(os.environ.get("DB_URL", ""))
    except ValueError as e:
        sys.exit(f"::error::{e}")
    print(f"::add-mask::{url}")
    with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as f:
        f.write(f"SUPABASE_URL={url}\n")
    print("Project URL set (masked)")
