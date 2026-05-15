export type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  low_stock_threshold: number;
  stock_quantity: number;
  purchase_cost: number;
  wholesale_price: number;
  retail_price: number;
  distributor_price: number;
  premium_event_price: number;
};

export type Contact = {
  id: string;
  full_name: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  gst_number?: string;
  is_client: boolean;
  is_supplier: boolean;
  current_balance: number;
  pending_amount: number;
  advance_paid: number;
  credit_limit: number;
  last_payment_date?: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  invoice_type: string;
  status: string;
  invoice_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  contact?: Contact;
};

export type Payment = {
  id: string;
  invoice_id?: string;
  amount: number;
  payment_date: string;
  method: string;
  reference_no?: string;
};

export type EventBooking = {
  id: string;
  client_contact_id: string;
  event_type: string;
  event_date: string;
  venue: string;
  quantity: number;
  delivery_time: string;
  advance_payment: number;
  remaining_due: number;
  unit_price: number;
  total_amount: number;
};

export type DashboardOverview = {
  kpis: Record<string, number>;
  charts: {
    salesLine: Array<{ label: string; sales: number; profit: number }>;
    weeklyGrowth: Array<{ label: string; sales: number; profit: number }>;
    productDistribution: Array<{ name: string; value: number }>;
    bestSellerHeatmap: Array<{ label: string; sales: number; profit: number }>;
    monthlyProfit: Array<{ label: string; sales: number; profit: number }>;
  };
  widgets: {
    lowStockAlerts: Array<{ id: string; name: string; sku: string; stock: number; threshold: number }>;
    pendingPaymentsList: Array<{ invoiceNumber: string; amountDue: number }>;
    todaysDeliveries: Array<{ invoiceNumber: string; amount: number }>;
    eventOrdersUpcoming: Array<{ id: string; venue: string; eventType: string; eventDate: string; remainingDue: number }>;
    notificationCenter: Array<{ id: string; title: string; message: string; type: string; createdAt: string }>;
  };
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

