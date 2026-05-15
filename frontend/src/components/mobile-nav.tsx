import { Bell, Boxes, Home, Receipt, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/inventory", icon: Boxes, label: "Stock" },
  { to: "/contacts", icon: Users, label: "CRM" },
  { to: "/invoices", icon: Receipt, label: "Bills" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border border-white/20 bg-slate-950/95 p-2 shadow-2xl shadow-slate-950/25 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-medium text-slate-300 transition",
                  isActive && "bg-blue-600 text-white",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

