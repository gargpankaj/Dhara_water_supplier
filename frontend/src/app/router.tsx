import { ReactNode, Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/layouts/app-shell";
import { ProtectedRoute } from "@/routes/protected-route";
import { LoadingScreen } from "@/components/loading-screen";

const LoginPage = lazy(() => import("@/pages/login-page"));
const RegisterPage = lazy(() => import("@/pages/register-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const InventoryPage = lazy(() => import("@/pages/inventory-page"));
const PricingPage = lazy(() => import("@/pages/pricing-page"));
const ContactsPage = lazy(() => import("@/pages/contacts-page"));
const InvoicesPage = lazy(() => import("@/pages/invoices-page"));
const EventsPage = lazy(() => import("@/pages/events-page"));
const AccountingPage = lazy(() => import("@/pages/accounting-page"));
const SearchPage = lazy(() => import("@/pages/search-page"));
const NotificationsPage = lazy(() => import("@/pages/notifications-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

const load = (node: ReactNode) => <Suspense fallback={<LoadingScreen />}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    path: "/login",
    element: load(<LoginPage />),
  },
  {
    path: "/register",
    element: load(<RegisterPage />),
  },
  {
    path: "/forgot-password",
    element: load(<ForgotPasswordPage />),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: load(<DashboardPage />) },
      { path: "inventory", element: load(<InventoryPage />) },
      { path: "pricing", element: load(<PricingPage />) },
      { path: "contacts", element: load(<ContactsPage />) },
      { path: "invoices", element: load(<InvoicesPage />) },
      { path: "events", element: load(<EventsPage />) },
      { path: "accounting", element: load(<AccountingPage />) },
      { path: "quick-sell", element: <Navigate to="/dashboard" replace /> },
      { path: "search", element: load(<SearchPage />) },
      { path: "notifications", element: load(<NotificationsPage />) },
    ],
  },
  {
    path: "*",
    element: load(<NotFoundPage />),
  },
]);
