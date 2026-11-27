-- Exact row count for every table in public, plus auth.users and storage.objects.
-- Read only. Output: schema.table <TAB> count. Used by ops.yml (live) and verify.yml (restored copy).
select format('%s.%s', table_schema, table_name),
       (xpath('/row/c/text()',
              query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
from information_schema.tables
where table_type = 'BASE TABLE'
  and (table_schema = 'public'
       or (table_schema = 'auth' and table_name = 'users')
       or (table_schema = 'storage' and table_name = 'objects'))
order by 1;
