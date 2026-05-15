import { Home, Boxes, BadgeIndianRupee, Users, Receipt, CalendarDays, WalletCards, ScanSearch, Bell } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/pricing", label: "Price Manager", icon: BadgeIndianRupee },
  { to: "/contacts", label: "CRM", icon: Users },
  { to: "/invoices", label: "Billing", icon: Receipt },
  { to: "/events", label: "Premium Events", icon: CalendarDays },
  { to: "/accounting", label: "Accounting", icon: WalletCards },
  { to: "/search", label: "Search", icon: ScanSearch },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function AppSidebar() {
  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-6 panel flex min-h-[calc(100vh-3rem)] flex-col p-5">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white dark:bg-white dark:text-slate-950">
            <div className="h-9 w-9 rounded-xl bg-blue-500" />
            <div>
              <p className="font-bold tracking-tight">AquaFlow</p>
              <p className="text-xs opacity-70">Control Center</p>
            </div>
          </div>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                    isActive && "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 dark:text-white",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-slate-950 p-4 text-white dark:bg-blue-600">
          <p className="text-sm font-semibold">Deployment ready</p>
          <p className="mt-1 text-xs text-white/70">
            Frontend is prepared for Vercel and backend for Render or Railway.
          </p>
        </div>
      </div>
    </aside>
  );
}
