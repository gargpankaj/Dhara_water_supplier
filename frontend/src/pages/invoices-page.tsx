import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, MessageSquareShare } from "lucide-react";
import { FormFieldBlock } from "@/components/form-field-block";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Contact, Invoice, Product } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  invoice_type: z.enum(["sale", "purchase", "return"]),
  contact_id: z.string().optional(),
  invoice_date: z.string().min(1),
  due_date: z.string().optional(),
  gst_enabled: z.boolean(),
  discount_amount: z.coerce.number().min(0),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      product_id: z.string().optional(),
      description: z.string().min(2),
      quantity: z.coerce.number().min(1),
      unit_price: z.coerce.number().min(1),
      tax_percent: z.coerce.number().min(0),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>("/invoices");
      return data;
    },
  });
  const clientsQuery = useQuery({
    queryKey: ["clients-for-invoice"],
    queryFn: async () => {
      const { data } = await api.get<Contact[]>("/clients");
      return data;
    },
  });
  const productsQuery = useQuery({
    queryKey: ["products-for-invoice"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>("/products");
      return data;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoice_type: "sale",
      contact_id: "",
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      gst_enabled: true,
      discount_amount: 0,
      notes: "",
      items: [{ product_id: "", description: "", quantity: 1, unit_price: 1, tax_percent: 18 }],
    },
  });
  const items = useFieldArray({ control: form.control, name: "items" });

  const createInvoiceMutation = useMutation({
    mutationFn: async (values: FormValues) => api.post("/invoices", values),
    onSuccess: () => {
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      form.reset({
        invoice_type: "sale",
        contact_id: "",
        invoice_date: new Date().toISOString().slice(0, 10),
        due_date: "",
        gst_enabled: true,
        discount_amount: 0,
        notes: "",
        items: [{ product_id: "", description: "", quantity: 1, unit_price: 1, tax_percent: 18 }],
      });
    },
  });

  async function sendReminder(invoiceId: string) {
    const { data } = await api.get<{ whatsappLink: string }>("/invoices/" + invoiceId + "/reminder");
    window.open(data.whatsappLink, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Sales, purchase, and return invoices"
        description="Create professional invoices with tax, discounts, multi-item carts, PDF export, and one-click WhatsApp reminders for outstanding dues."
      />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create invoice</h3>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => createInvoiceMutation.mutate(values))}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormFieldBlock label="Invoice type" hint="Choose whether you are billing a sale, a purchase, or a return." required>
                <select className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50" {...form.register("invoice_type")}>
                  <option value="sale">Sale invoice</option>
                  <option value="purchase">Purchase invoice</option>
                  <option value="return">Return invoice</option>
                </select>
              </FormFieldBlock>
              <FormFieldBlock label="Client or supplier" hint="Pick the party this invoice belongs to.">
                <select className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50" {...form.register("contact_id")}>
                  <option value="">Select client or supplier</option>
                  {clientsQuery.data?.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </option>
                  ))}
                </select>
              </FormFieldBlock>
              <FormFieldBlock label="Invoice date" hint="Date printed on the invoice." required>
                <Input type="date" {...form.register("invoice_date")} />
              </FormFieldBlock>
              <FormFieldBlock label="Due date" hint="Optional payment deadline for credit invoices.">
                <Input type="date" {...form.register("due_date")} />
              </FormFieldBlock>
              <FormFieldBlock label="Discount amount" hint="Optional flat discount applied to the whole invoice.">
                <Input type="number" step="0.01" placeholder="100" {...form.register("discount_amount")} />
              </FormFieldBlock>
              <FormFieldBlock label="Notes or delivery instructions" hint="Optional operational note printed on or stored with the invoice.">
                <Input placeholder="Deliver before 5 PM and collect empty jars" {...form.register("notes")} />
              </FormFieldBlock>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose invoice type, customer or supplier, dates, then add one or more line items below.
            </p>

            <div className="space-y-3 rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900">
              {items.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 rounded-2xl border border-white/40 p-3 dark:border-slate-800 md:grid-cols-[1.2fr_1fr_0.7fr_0.8fr_0.8fr_auto]">
                  <select
                    className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50"
                    {...form.register(`items.${index}.product_id`)}
                    onChange={(event) => {
                      const selected = productsQuery.data?.find((item) => item.id === event.target.value);
                      form.setValue(`items.${index}.product_id`, event.target.value);
                      form.setValue(`items.${index}.description`, selected?.name || "");
                      form.setValue(
                        `items.${index}.unit_price`,
                        Number(selected?.retail_price || selected?.wholesale_price || 1),
                      );
                    }}
                  >
                    <option value="">Select product</option>
                    {productsQuery.data?.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <Input placeholder="Line item description" {...form.register(`items.${index}.description`)} />
                  <Input type="number" placeholder="Qty" {...form.register(`items.${index}.quantity`)} />
                  <Input type="number" step="0.01" placeholder="Unit price" {...form.register(`items.${index}.unit_price`)} />
                  <Input type="number" step="0.01" placeholder="Tax %" {...form.register(`items.${index}.tax_percent`)} />
                  <Button type="button" variant="ghost" onClick={() => items.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  items.append({ product_id: "", description: "", quantity: 1, unit_price: 1, tax_percent: 18 })
                }
              >
                Add line item
              </Button>
            </div>
            <label className="flex items-center gap-2 rounded-2xl bg-slate-100/70 p-4 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <input type="checkbox" {...form.register("gst_enabled")} />
              GST enabled for this invoice
            </label>
            <Button className="w-full" type="submit" disabled={createInvoiceMutation.isPending}>
              {createInvoiceMutation.isPending ? "Generating invoice..." : "Create invoice"}
            </Button>
          </form>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent invoices</h3>
          <div className="space-y-3">
            {invoicesQuery.data?.map((invoice) => (
              <div key={invoice.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {invoice.invoice_type} • {invoice.invoice_date}
                    </p>
                  </div>
                  <Badge tone={invoice.amount_due > 0 ? "warning" : "success"}>{invoice.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <MiniStat label="Total" value={invoice.total_amount} />
                  <MiniStat label="Paid" value={invoice.amount_paid} />
                  <MiniStat label="Due" value={invoice.amount_due} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => window.open(`${api.defaults.baseURL}/invoices/${invoice.id}/pdf`, "_blank")}>
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  {invoice.amount_due > 0 && (
                    <Button type="button" variant="outline" onClick={() => void sendReminder(invoice.id)}>
                      <MessageSquareShare className="mr-2 h-4 w-4" />
                      Send reminder
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(value)}</p>
    </div>
  );
}
