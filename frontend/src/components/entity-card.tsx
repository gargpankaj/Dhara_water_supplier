import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function EntityCard({
  title,
  subtitle,
  role,
  balance,
  pending,
  extra,
}: {
  title: string;
  subtitle: string;
  role: string;
  balance: number;
  pending: number;
  extra?: React.ReactNode;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <Badge tone={pending > 0 ? "warning" : "success"}>{role}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">Balance</p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(balance)}</p>
        </div>
        <div className="rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">Pending</p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(pending)}</p>
        </div>
      </div>
      {extra}
    </Card>
  );
}

