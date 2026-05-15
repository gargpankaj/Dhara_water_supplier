import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormFieldBlock } from "@/components/form-field-block";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Payment } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

const expenseSchema = z.object({
  category: z.string().min(2),
  description: z.string().min(2),
  amount: z.coerce.number().min(1),
  expense_date: z.string().min(1),
  vendor_name: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

export default function AccountingPage() {
  const queryClient = useQueryClient();
  const start = new Date();
  start.setDate(1);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  const reportQuery = useQuery({
    queryKey: ["financial-report", startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get("/reports/financial", { params: { start_date: startDate, end_date: endDate } });
      return data;
    },
  });
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await api.get<Payment[]>("/payments");
      return data;
    },
  });
  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "Utilities",
      description: "",
      amount: 0,
      expense_date: endDate,
      vendor_name: "",
    },
  });
  const expenseMutation = useMutation({
    mutationFn: async (values: ExpenseForm) => api.post("/reports/expenses", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
      expenseForm.reset();
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accounts"
        title="Accounting system"
        description="Track daily P&L, cash flow, expense breakdowns, ledger movement, and a lite balance sheet in one finance module."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceCard label="Sales" value={reportQuery.data?.summary.sales || 0} />
        <FinanceCard label="Expenses" value={reportQuery.data?.summary.expenses || 0} />
        <FinanceCard label="Cash flow" value={reportQuery.data?.summary.cashFlow || 0} />
        <FinanceCard label="Net profit" value={reportQuery.data?.summary.netProfit || 0} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Log expense</h3>
          <form className="space-y-4" onSubmit={expenseForm.handleSubmit((values) => expenseMutation.mutate(values))}>
            <FormFieldBlock label="Expense category" hint="Group the expense for reporting, for example Fuel, Salary, Rent, or Utilities." required>
              <Input placeholder="Fuel" {...expenseForm.register("category")} />
            </FormFieldBlock>
            <FormFieldBlock label="Expense description" hint="Explain what was paid for so reports stay understandable later." required>
              <Input placeholder="Delivery van diesel" {...expenseForm.register("description")} />
            </FormFieldBlock>
            <FormFieldBlock label="Amount paid" hint="Total expense amount for this transaction." required>
              <Input type="number" step="0.01" placeholder="2500" {...expenseForm.register("amount")} />
            </FormFieldBlock>
            <FormFieldBlock label="Expense date" hint="Date the payment or cost was incurred." required>
              <Input type="date" {...expenseForm.register("expense_date")} />
            </FormFieldBlock>
            <FormFieldBlock label="Vendor or payee name" hint="Optional supplier, employee, landlord, or service provider name.">
              <Input placeholder="Indian Oil Fuel Station" {...expenseForm.register("vendor_name")} />
            </FormFieldBlock>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record any non-sales outflow such as materials, salaries, fuel, maintenance, rent, or utilities.
            </p>
            <Button className="w-full" type="submit" disabled={expenseMutation.isPending}>
              {expenseMutation.isPending ? "Saving..." : "Add expense"}
            </Button>
          </form>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent payments and expense breakdown</h3>
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              {paymentsQuery.data?.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {payment.method} • {payment.payment_date}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {reportQuery.data?.expenseBreakdown?.map((entry: { category: string; amount: number }) => (
                <div key={entry.category} className="rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900">
                  <p className="font-medium text-slate-900 dark:text-white">{entry.category}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatCurrency(entry.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FinanceCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(value)}</p>
    </Card>
  );
}
