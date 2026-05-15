import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NotificationItem } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function NotificationDrawer() {
  const notificationsQuery = useQuery({
    queryKey: ["notifications-mini"],
    queryFn: async () => {
      const { data } = await api.get<NotificationItem[]>("/notifications");
      return data.slice(0, 4);
    },
  });

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <Bell className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Notification center</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Live alerts from payments and inventory</p>
        </div>
      </div>
      <div className="space-y-3">
        {notificationsQuery.data?.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200/70 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
              <Badge tone={item.is_read ? "default" : "info"}>{item.type}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

