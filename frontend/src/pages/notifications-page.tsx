import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { NotificationItem } from "@/types/domain";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications-page"],
    queryFn: async () => {
      const { data } = await api.get<NotificationItem[]>("/notifications");
      return data;
    },
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-page"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alerts"
        title="Notifications system"
        description="Track low stock, pending payment, premium event, and payment receipt alerts in one clean notification center."
      />
      <div className="grid gap-4">
        {notificationsQuery.data?.map((item) => (
          <Card key={item.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <Badge tone={item.is_read ? "default" : "info"}>{item.type}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.message}</p>
              <p className="mt-2 text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
            </div>
            {!item.is_read && (
              <Button type="button" variant="outline" onClick={() => readMutation.mutate(item.id)}>
                Mark as read
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

