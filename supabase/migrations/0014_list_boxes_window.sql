drop function if exists list_boxes_near(double precision, double precision);

create function list_boxes_near(p_lat double precision, p_lng double precision)
returns table (
  id uuid, "storeId" uuid, title text, price numeric, "originalPrice" numeric,
  "stockQty" int, "photoUrl" text, "bestBefore" date, "pickupEnd" timestamptz, "pickupStart" timestamptz,
  tipo box_tipo, items text[], "storeName" text, neighborhood text, lat double precision, lng double precision,
  "distanceKm" double precision, "storeRating" numeric
) language sql stable set search_path = public as $$
  select b.id, b."storeId", b.title, b.price, b."originalPrice",
    b."stockQty", b."photoUrl", b."bestBefore", b."pickupEnd", b."pickupStart", b.tipo, b.items,
    s.name, s.neighborhood, s.lat, s.lng,
    6371 * acos(greatest(-1, least(1,
      cos(radians(p_lat)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(p_lng))
      + sin(radians(p_lat)) * sin(radians(s.lat))))) as "distanceKm",
    coalesce((select round(avg(r.rating), 1) from review r where r."storeId" = s.id), 0)
  from box b join store s on s.id = b."storeId"
  where b.status = 'active' and b."stockQty" > 0 and b."pickupEnd" > now()
  order by "distanceKm" asc;
$$;

grant execute on function list_boxes_near(double precision, double precision) to anon, authenticated;
