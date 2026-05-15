import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { FormFieldBlock } from "@/components/form-field-block";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Contact, EventBooking } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  client_contact_id: z.string().min(1),
  event_type: z.enum(["wedding", "corporate", "private_party", "exhibition", "other"]),
  event_date: z.string().min(1),
  venue: z.string().min(2),
  quantity: z.coerce.number().min(1),
  delivery_time: z.string().min(1),
  special_notes: z.string().optional(),
  advance_payment: z.coerce.number().min(0),
  payment_schedule: z.string().optional(),
  unit_price: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function EventsPage() {
  const queryClient = useQueryClient();
  const clientsQuery = useQuery({
    queryKey: ["clients-events"],
    queryFn: async () => {
      const { data } = await api.get<Contact[]>("/clients");
      return data;
    },
  });
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await api.get<EventBooking[]>("/events");
      return data;
    },
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_contact_id: "",
      event_type: "corporate",
      event_date: new Date().toISOString().slice(0, 10),
      venue: "",
      quantity: 100,
      delivery_time: "18:00",
      special_notes: "",
      advance_payment: 0,
      payment_schedule: "",
      unit_price: 36,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => api.post("/events", values),
    onSuccess: () => {
      toast.success("Event booking created");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      form.reset();
    },
  });

  const chartData = (eventsQuery.data || []).map((event) => ({
    month: event.event_date.slice(0, 7),
    revenue: event.total_amount,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Premium module"
        title="Premium event bookings"
        description="Capture event details, delivery timing, advance collections, and premium bottle profitability from a dedicated workflow."
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Book premium event</h3>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
            <FormFieldBlock label="Client name" hint="Select the client placing this premium bottle booking." required>
              <select className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50" {...form.register("client_contact_id")}>
                <option value="">Select client</option>
                {clientsQuery.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </FormFieldBlock>
            <div className="grid gap-4 md:grid-cols-2">
              <FormFieldBlock label="Event type" hint="Pick the booking type for reporting and planning." required>
                <select className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50" {...form.register("event_type")}>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate</option>
                  <option value="private_party">Private Party</option>
                  <option value="exhibition">Exhibition</option>
                  <option value="other">Other</option>
                </select>
              </FormFieldBlock>
              <FormFieldBlock label="Event date" hint="Date the premium water delivery is required." required>
                <Input type="date" {...form.register("event_date")} />
              </FormFieldBlock>
              <FormFieldBlock label="Venue" hint="Exact event location or banquet hall name." required>
                <Input placeholder="Royal Orchid Banquet Hall" {...form.register("venue")} />
              </FormFieldBlock>
              <FormFieldBlock label="Delivery time" hint="Time the bottles should arrive at the venue." required>
                <Input placeholder="06:30 PM" {...form.register("delivery_time")} />
              </FormFieldBlock>
              <FormFieldBlock label="Bottle quantity" hint="Number of premium bottles requested for the event." required>
                <Input type="number" placeholder="500" {...form.register("quantity")} />
              </FormFieldBlock>
              <FormFieldBlock label="Price per premium bottle" hint="Selling price charged for each premium bottle in this booking." required>
                <Input type="number" step="0.01" placeholder="36.00" {...form.register("unit_price")} />
              </FormFieldBlock>
              <FormFieldBlock label="Advance already received" hint="Amount the client has already paid before the event." required>
                <Input type="number" step="0.01" placeholder="5000" {...form.register("advance_payment")} />
              </FormFieldBlock>
            </div>
            <FormFieldBlock label="Special notes" hint="Optional notes such as custom branding, chilled delivery, or VIP setup.">
              <Textarea placeholder="Custom branded labels and chilled delivery at service gate" {...form.register("special_notes")} />
            </FormFieldBlock>
            <FormFieldBlock label="Payment schedule" hint="Optional staged payment plan agreed with the client.">
              <Textarea placeholder="50% now and balance 2 days before the event" {...form.register("payment_schedule")} />
            </FormFieldBlock>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Use this form for weddings, corporate events, private parties, and other premium bottle bookings.
            </p>
            <Button className="w-full" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving booking..." : "Create booking"}
            </Button>
          </form>
        </Card>
        <div className="space-y-6">
          <ChartBlock chartData={chartData} />
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming premium jobs</h3>
            <div className="space-y-3">
              {eventsQuery.data?.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{event.venue}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {event.event_type} • {event.event_date}
                      </p>
                    </div>
                    <p className="font-semibold text-blue-600 dark:text-blue-300">{formatCurrency(event.total_amount)}</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <MiniStat label="Quantity" value={String(event.quantity)} />
                    <MiniStat label="Advance" value={formatCurrency(event.advance_payment)} />
                    <MiniStat label="Due" value={formatCurrency(event.remaining_due)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChartBlock({ chartData }: { chartData: Array<{ month: string; revenue: number }> }) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Seasonal premium demand</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Compare premium event revenue patterns over time.</p>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.35} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
