insert into roles (name, description)
values
  ('Owner', 'Full system access'),
  ('Manager', 'Operations and billing access'),
  ('Staff', 'Daily workflows and inventory access'),
  ('Accountant', 'Payments, reports, and expenses access')
on conflict (name) do nothing;

insert into users (full_name, email, phone, password_hash, role_id)
select
  'Admin Owner',
  'admin@aquaflow.com',
  '+91-9000000000',
  crypt('Admin@123', gen_salt('bf')),
  roles.id
from roles
where roles.name = 'Owner'
and not exists (
  select 1 from users where email = 'admin@aquaflow.com'
);

insert into products (sku, name, category, unit, low_stock_threshold, stock_quantity, purchase_cost, wholesale_price, retail_price, distributor_price, premium_event_price)
values
  ('RAW-BOTTLE-001', 'Empty Bottles', 'raw_material', 'pcs', 500, 1200, 4.50, 0, 0, 0, 0),
  ('RAW-CAP-001', 'Caps', 'raw_material', 'pcs', 500, 1300, 0.75, 0, 0, 0, 0),
  ('FG-250ML-001', '250ml Bottle', 'finished_good', 'pcs', 120, 300, 6.00, 8.50, 10.00, 8.00, 12.00),
  ('FG-1L-001', '1L Bottle', 'finished_good', 'pcs', 80, 180, 11.50, 16.00, 18.00, 15.00, 22.00),
  ('FG-5L-001', '5L Bottle', 'finished_good', 'pcs', 40, 65, 38.00, 48.00, 55.00, 46.00, 60.00),
  ('PRM-EVT-001', 'Premium Event Bottle', 'premium', 'pcs', 50, 90, 24.00, 0, 0, 0, 36.00)
on conflict (sku) do nothing;
