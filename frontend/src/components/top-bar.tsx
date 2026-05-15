import { LogOut, MoonStar, SunMedium } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { clearSession, getStoredUser, toggleTheme } from "@/lib/auth";

const titleMap: Record<string, string> = {
  "/dashboard": "Business overview",
  "/inventory": "Inventory command center",
  "/pricing": "Pricing intelligence",
  "/contacts": "Client and supplier CRM",
  "/invoices": "Billing and invoicing",
  "/events": "Premium event bookings",
  "/accounting": "Financial reporting",
  "/quick-sell": "Mobile quick sell",
  "/search": "Global search",
  "/notifications": "Notification center",
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const isDarkMode = document.documentElement.classList.contains("dark");

  return (
    <div className="panel mb-6 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back</p>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {titleMap[location.pathname] || "AquaFlow workspace"}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:block">
          {user?.full_name} • {user?.role}
        </div>
        <Button type="button" variant="outline" size="icon" onClick={toggleTheme}>
          {isDarkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearSession();
            navigate("/login");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

