create or replace function store_reservations()
returns table (
  id uuid,
  code text,
  status reservation_status,
  amount numeric,
  "paymentMethod" payment_method,
  "reservedAt" timestamptz,
  "pickedUpAt" timestamptz,
  "boxId" uuid,
  "boxTitle" text,
  "storeId" uuid,
  "storeName" text,
  "customerName" text,
  "customerPhone" text
) language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return query
    select r.id, r.code, r.status, r.amount, r."paymentMethod", r."reservedAt", r."pickedUpAt",
      b.id, b.title, s.id, s.name, p."fullName", p.phone
    from reservation r
    join box b on b.id = r."boxId"
    join store s on s.id = b."storeId"
    join profile p on p.id = r."customerId"
    where s."ownerId" = auth.uid()
    order by r."reservedAt" desc;
end; $$;

revoke execute on function store_reservations() from public, anon;
grant execute on function store_reservations() to authenticated;

do $$ begin
  alter publication supabase_realtime add table reservation;
exception when duplicate_object then null;
end $$;
