# Database Schema Summary

Primary domain tables:

- `roles`
- `users`
- `contacts`
- `clients`
- `suppliers`
- `products`
- `inventory_logs`
- `price_history`
- `invoices`
- `invoice_items`
- `payments`
- `expenses`
- `event_bookings`
- `notifications`
- `audit_logs`
- `password_reset_tokens`

Relationship design:

- `users.role_id -> roles.id`
- `clients.contact_id -> contacts.id`
- `suppliers.contact_id -> contacts.id`
- `inventory_logs.product_id -> products.id`
- `price_history.product_id -> products.id`
- `invoices.contact_id -> contacts.id`
- `invoice_items.invoice_id -> invoices.id`
- `invoice_items.product_id -> products.id`
- `payments.invoice_id -> invoices.id`
- `payments.contact_id -> contacts.id`
- `event_bookings.client_contact_id -> contacts.id`
- `notifications.user_id -> users.id`
- `audit_logs.user_id -> users.id`

Index focus:

- email, role, phone, sku, barcode
- invoice dates and numbers
- payment and notification lookup paths
- event date and inventory product joins

