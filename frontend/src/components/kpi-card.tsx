import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  insight,
}: {
  label: string;
  value: number;
  insight: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="relative overflow-hidden">
        <div className="absolute right-4 top-4 rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(value)}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{insight}</p>
      </Card>
    </motion.div>
  );
}

