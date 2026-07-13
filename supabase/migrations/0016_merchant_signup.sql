create or replace function register_merchant(
  p_store_name text,
  p_address text,
  p_neighborhood text,
  p_lat double precision,
  p_lng double precision,
  p_photo_url text,
  p_pickup_info text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_role user_role;
  v_store_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_store_name is null or length(trim(p_store_name)) = 0 then raise exception 'invalid_store'; end if;
  if p_address is null or length(trim(p_address)) = 0 then raise exception 'invalid_address'; end if;
  if p_lat is null or p_lng is null then raise exception 'invalid_location'; end if;

  select role into v_role from profile where id = v_uid;
  if v_role is null then raise exception 'no_profile'; end if;

  if v_role = 'customer' then
    update profile set role = 'merchant' where id = v_uid;
  end if;

  insert into store ("ownerId", name, address, neighborhood, lat, lng, "photoUrl", "pickupInfo")
  values (v_uid, trim(p_store_name), trim(p_address), nullif(trim(coalesce(p_neighborhood, '')), ''),
          p_lat, p_lng, nullif(trim(coalesce(p_photo_url, '')), ''), nullif(trim(coalesce(p_pickup_info, '')), ''))
  returning id into v_store_id;

  return v_store_id;
end; $$;

revoke execute on function register_merchant(text, text, text, double precision, double precision, text, text) from public, anon;
grant execute on function register_merchant(text, text, text, double precision, double precision, text, text) to authenticated;
