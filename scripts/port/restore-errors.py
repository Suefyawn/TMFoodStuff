"""Summarise pg_restore errors without printing their text.

Usage: restore-errors.py restore.err
Prints the number of errors and, per failed TOC entry, its object type and schema only
(the error and 'Command was' lines can quote row values, so they are never printed).
"""
import collections
import re
import sys

text = open(sys.argv[1], encoding="utf-8", errors="replace").read()
errors = len(re.findall(r"^pg_restore: error", text, flags=re.M))
kinds = collections.Counter()
# "pg_restore: from TOC entry 1234; 1259 16390 TABLE DATA public orders postgres"
TYPES = r"(TABLE DATA|TABLE|SEQUENCE SET|SEQUENCE OWNED BY|SEQUENCE|INDEX|CONSTRAINT|FK CONSTRAINT|TRIGGER|POLICY|ROW SECURITY|FUNCTION|VIEW|MATERIALIZED VIEW|TYPE|DOMAIN|EXTENSION|SCHEMA|COMMENT|DEFAULT|RULE|PUBLICATION|EVENT TRIGGER|ACL)"
for m in re.finditer(r"^pg_restore: from TOC entry \d+; \d+ \d+ " + TYPES + r" (\S+)", text, flags=re.M):
    schema = m.group(2) if re.fullmatch(r"[a-z_][a-z0-9_]*", m.group(2)) else "-"
    kinds[(m.group(1), schema)] += 1
# Without --verbose there are no TOC lines: fall back to the statement's first keywords only
# ("CREATE POLICY", "ALTER TABLE", "COPY"), never the rest of the line.
if not kinds:
    for m in re.finditer(r"^Command was: ((?:CREATE|ALTER|COPY|SELECT|COMMENT|GRANT|REVOKE|SET)(?: (?:OR REPLACE|UNIQUE|MATERIALIZED|TABLE|SCHEMA|INDEX|POLICY|FUNCTION|TRIGGER|VIEW|TYPE|DOMAIN|EXTENSION|SEQUENCE|CONSTRAINT|ROLE|ON))*)", text, flags=re.M):
        kinds[(m.group(1), "-")] += 1
print(f"restore errors: {errors}")
for (kind, schema), n in sorted(kinds.items()):
    print(f"  {n} x {kind} in {schema}")
if errors:
    print(f"::warning::pg_restore reported {errors} error(s); see the types above. Row counts decide PASS.")
