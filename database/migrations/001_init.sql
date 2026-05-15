create extension if not exists pgcrypto;

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  phone text,
  password_hash text not null,
  is_active boolean not null default true,
  role_id uuid not null references roles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role_id on users(role_id);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  whatsapp text,
  email text,
  address text,
  gst_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_contacts_phone on contacts(phone);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid unique not null references contacts(id) on delete cascade,
  current_balance numeric(12,2) not null default 0,
  pending_amount numeric(12,2) not null default 0,
  advance_paid numeric(12,2) not null default 0,
  credit_limit numeric(12,2) not null default 0,
  last_payment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid unique not null references contacts(id) on delete cascade,
  current_balance numeric(12,2) not null default 0,
  pending_amount numeric(12,2) not null default 0,
  advance_paid numeric(12,2) not null default 0,
  credit_limit numeric(12,2) not null default 0,
  last_payment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text not null check (category in ('raw_material', 'finished_good', 'premium')),
  unit text not null default 'pcs',
  description text,
  barcode text,
  low_stock_threshold integer not null default 10,
  stock_quantity integer not null default 0,
  purchase_cost numeric(12,2) not null default 0,
  wholesale_price numeric(12,2) not null default 0,
  retail_price numeric(12,2) not null default 0,
  distributor_price numeric(12,2) not null default 0,
  premium_event_price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_sku on products(sku);
create index if not exists idx_products_barcode on products(barcode);

create table if not exists inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  action text not null check (action in ('add', 'remove', 'transfer', 'damaged', 'adjustment', 'sold', 'purchased')),
  quantity integer not null,
  batch_number text,
  unit_cost numeric(12,2),
  notes text,
  created_by_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inventory_logs_product_id on inventory_logs(product_id);

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  price_type text not null,
  old_price numeric(12,2) not null default 0,
  new_price numeric(12,2) not null default 0,
  effective_date timestamptz not null,
  changed_by_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_price_history_product_id on price_history(product_id);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  invoice_type text not null check (invoice_type in ('sale', 'purchase', 'return')),
  status text not null default 'pending' check (status in ('draft', 'paid', 'partial', 'pending', 'overdue')),
  contact_id uuid references contacts(id),
  invoice_date date not null,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  amount_due numeric(12,2) not null default 0,
  gst_enabled boolean not null default false,
  notes text,
  created_by_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_contact_id on invoices(contact_id);
create index if not exists idx_invoices_invoice_date on invoices(invoice_date);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  product_id uuid references products(id),
  description text not null,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  tax_percent numeric(5,2) not null default 0,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id),
  contact_id uuid references contacts(id),
  amount numeric(12,2) not null,
  payment_date date not null,
  method text not null check (method in ('cash', 'upi', 'bank', 'cheque')),
  reference_no text,
  notes text,
  created_by_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_invoice_id on payments(invoice_id);
create index if not exists idx_payments_contact_id on payments(contact_id);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  amount numeric(12,2) not null,
  expense_date date not null,
  vendor_name text,
  created_by_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_expenses_category on expenses(category);

create table if not exists event_bookings (
  id uuid primary key default gen_random_uuid(),
  client_contact_id uuid not null references contacts(id),
  event_type text not null check (event_type in ('wedding', 'corporate', 'private_party', 'exhibition', 'other')),
  event_date date not null,
  venue text not null,
  quantity integer not null,
  delivery_time text not null,
  special_notes text,
  advance_payment numeric(12,2) not null default 0,
  remaining_due numeric(12,2) not null default 0,
  payment_schedule text,
  unit_price numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  created_by_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_event_bookings_event_date on event_bookings(event_date);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  user_id uuid references users(id),
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_type on notifications(type);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata_json text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  is_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, otp_code)
);
create index if not exists idx_password_reset_tokens_email on password_reset_tokens(email);

