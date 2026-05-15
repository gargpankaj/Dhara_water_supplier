import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { EntityCard } from "@/components/entity-card";
import { FormFieldBlock } from "@/components/form-field-block";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Contact } from "@/types/domain";

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(6),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  gst_number: z.string().optional(),
  notes: z.string().optional(),
  is_client: z.boolean(),
  is_supplier: z.boolean(),
  credit_limit: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await api.get<Contact[]>("/clients");
      return data;
    },
  });
  const suppliersQuery = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await api.get<Contact[]>("/suppliers");
      return data;
    },
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      phone: "",
      whatsapp: "",
      address: "",
      gst_number: "",
      notes: "",
      is_client: true,
      is_supplier: false,
      credit_limit: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!values.is_client && !values.is_supplier) {
        throw new Error("Select at least one role");
      }
      if (values.is_client) {
        return api.post("/clients", values);
      }
      return api.post("/suppliers", values);
    },
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      form.reset();
    },
  });

  const combined = [...(clientsQuery.data || []), ...(suppliersQuery.data || [])].filter(
    (item, index, array) => array.findIndex((entry) => entry.id === item.id) === index,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Unified client and supplier cards"
        description="Manage all business relationships from one card system with role toggles, ledger balances, and communication-ready contact details."
      />
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create relationship card</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Mark a profile as client, supplier, or both to support a unified ledger model.</p>
          </div>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
            <FormFieldBlock label="Full name" hint="Use the business or contact name you want to appear in CRM, invoices, and ledgers." required>
              <Input placeholder="Rahul Traders" {...form.register("full_name")} />
            </FormFieldBlock>
            <div className="grid gap-4 md:grid-cols-2">
              <FormFieldBlock label="Primary phone number" hint="Main number used for calls and invoice follow-up." required>
                <Input placeholder="+91 98765 43210" {...form.register("phone")} />
              </FormFieldBlock>
              <FormFieldBlock label="WhatsApp number" hint="Optional number used for reminders and delivery communication.">
                <Input placeholder="+91 98765 43210" {...form.register("whatsapp")} />
              </FormFieldBlock>
            </div>
            <FormFieldBlock label="GST number" hint="Optional tax identifier for registered businesses.">
              <Input placeholder="27ABCDE1234F1Z5" {...form.register("gst_number")} />
            </FormFieldBlock>
            <FormFieldBlock label="Credit limit allowed" hint="Maximum outstanding balance you allow this client to carry.">
              <Input placeholder="50000" type="number" {...form.register("credit_limit")} />
            </FormFieldBlock>
            <FormFieldBlock label="Full address" hint="Delivery or billing address for this contact.">
              <Textarea placeholder="Shop 12, MG Road, Pune" {...form.register("address")} />
            </FormFieldBlock>
            <FormFieldBlock label="Internal notes" hint="Private notes such as payment habits, follow-up preference, or route details.">
              <Textarea placeholder="Pays every Friday and prefers WhatsApp reminders" {...form.register("notes")} />
            </FormFieldBlock>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create one shared card for a person or business, then mark whether they act as a client, supplier, or both.
            </p>
            <div className="flex flex-wrap gap-6 rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input type="checkbox" {...form.register("is_client")} />
                Client: buys bottled water from you
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input type="checkbox" {...form.register("is_supplier")} />
                Supplier: sells goods or materials to you
              </label>
            </div>
            <Button className="w-full" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save profile card"}
            </Button>
          </form>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {combined.map((contact) => (
            <EntityCard
              key={contact.id}
              title={contact.full_name}
              subtitle={`${contact.phone}${contact.whatsapp ? ` • WhatsApp ${contact.whatsapp}` : ""}`}
              role={contact.is_client && contact.is_supplier ? "Both" : contact.is_client ? "Client" : "Supplier"}
              balance={contact.current_balance}
              pending={contact.pending_amount}
              extra={
                <div className="rounded-2xl bg-slate-100/70 p-3 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <p>{contact.address || "No address added yet"}</p>
                  <p className="mt-2">GST: {contact.gst_number || "Not set"}</p>
                </div>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
