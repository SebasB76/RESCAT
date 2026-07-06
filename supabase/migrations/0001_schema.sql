create type user_role as enum ('customer', 'merchant');
create type box_status as enum ('active', 'soldOut', 'expired');
create type payment_method as enum ('cashOnPickup', 'cardMock');
create type reservation_status as enum ('reserved', 'paid', 'pickedUp', 'expired', 'cancelled');

create table profile (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  "fullName" text,
  phone text,
  "createdAt" timestamptz not null default now()
);

create table store (
  id uuid primary key default gen_random_uuid(),
  "ownerId" uuid not null references profile(id) on delete cascade,
  name text not null,
  address text not null,
  neighborhood text,
  lat double precision not null,
  lng double precision not null,
  "photoUrl" text,
  "pickupInfo" text,
  "createdAt" timestamptz not null default now()
);

create table box (
  id uuid primary key default gen_random_uuid(),
  "storeId" uuid not null references store(id) on delete cascade,
  title text not null,
  description text,
  items text[] not null default '{}',
  category text,
  "originalPrice" numeric(10,2) not null,
  price numeric(10,2) not null,
  "stockQty" int not null check ("stockQty" >= 0),
  "bestBefore" date,
  "pickupStart" timestamptz not null,
  "pickupEnd" timestamptz not null,
  "photoUrl" text,
  status box_status not null default 'active',
  "createdAt" timestamptz not null default now()
);

create table reservation (
  id uuid primary key default gen_random_uuid(),
  "boxId" uuid not null references box(id) on delete cascade,
  "customerId" uuid not null references profile(id) on delete cascade,
  code text not null unique,
  "paymentMethod" payment_method not null,
  status reservation_status not null default 'reserved',
  amount numeric(10,2) not null,
  "reservedAt" timestamptz not null default now(),
  "expiresAt" timestamptz not null,
  "pickedUpAt" timestamptz
);

create table review (
  id uuid primary key default gen_random_uuid(),
  "reservationId" uuid not null unique references reservation(id) on delete cascade,
  "storeId" uuid not null references store(id) on delete cascade,
  "customerId" uuid not null references profile(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  "createdAt" timestamptz not null default now()
);

create index on box ("storeId");
create index on box (status);
create index on reservation ("boxId");
create index on reservation ("customerId");
create index on review ("storeId");
