import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/chart-card";
import { KpiCard } from "@/components/kpi-card";
import { NotificationDrawer } from "@/components/notification-drawer";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { DashboardOverview } from "@/types/domain";

const pieColors = ["#2563eb", "#0ea5e9", "#38bdf8", "#7dd3fc", "#93c5fd"];

export default function DashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const { data } = await api.get<DashboardOverview>("/dashboard/overview");
      return data;
    },
  });

  const data = overviewQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations cockpit"
        title="Business dashboard"
        description="Monitor revenue, low stock, pending payments, deliveries, and premium event performance from a single command center."
      />

      {!data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Revenue today" value={data.kpis.totalRevenueToday} insight="Fresh sales posted today" />
          <KpiCard label="Revenue this week" value={data.kpis.revenueThisWeek} insight="Weekly top-line momentum" />
          <KpiCard label="Net profit" value={data.kpis.netProfit} insight="Revenue minus tracked expenses" />
          <KpiCard label="Pending payments" value={data.kpis.pendingPayments} insight="Outstanding receivables to follow up" />
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <ChartCard title="Sales trend" description="Daily sales and margin movement across the last 30 days.">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.salesLine}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} />
                    <XAxis dataKey="label" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Product mix" description="SKU distribution across raw, finished, and premium stock.">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.charts.productDistribution} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105}>
                      {data.charts.productDistribution.map((_, index) => (
                        <Cell key={index} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <ChartCard title="Monthly profit" description="Daily profit estimate based on current sales and expenses.">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.monthlyProfit}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} />
                    <XAxis dataKey="label" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="profit" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <NotificationDrawer />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Low stock alerts</h3>
              <div className="mt-4 space-y-3">
                {data.widgets.lowStockAlerts.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.sku}</p>
                      </div>
                      <Badge tone="warning">{item.stock} left</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pending payments</h3>
              <div className="mt-4 space-y-3">
                {data.widgets.pendingPaymentsList.map((item) => (
                  <div key={item.invoiceNumber} className="rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900">
                    <p className="font-medium text-slate-900 dark:text-white">{item.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatCurrency(item.amountDue)}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming events</h3>
              <div className="mt-4 space-y-3">
                {data.widgets.eventOrdersUpcoming.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900 dark:text-white">{item.venue}</p>
                      <Badge tone="info">{item.eventType}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.eventDate}</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(item.remainingDue)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

