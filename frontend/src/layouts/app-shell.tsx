import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { QuickSellFab } from "@/components/quick-sell-fab";
import { TopBar } from "@/components/top-bar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-dashboard-gradient px-4 py-6 dark:bg-dashboard-gradient-dark md:px-6">
      <div className="mx-auto flex max-w-[1600px] gap-6">
        <AppSidebar />
        <main className="min-w-0 flex-1 pb-24 lg:pb-10">
          <TopBar />
          <Outlet />
        </main>
      </div>
      <QuickSellFab />
      <MobileNav />
    </div>
  );
}
