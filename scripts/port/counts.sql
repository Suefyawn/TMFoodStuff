-- Exact row count for every table in the public, auth and storage schemas.
-- Read only. Output: schema.table <TAB> count. Used by ops.yml (live, inside the dump's snapshot)
-- and verify.yml (restored copy).
select format('%s.%s', table_schema, table_name),
       (xpath('/row/c/text()',
              query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
from information_schema.tables
where table_type = 'BASE TABLE'
  and table_schema in ('public', 'auth', 'storage')
order by 1;
