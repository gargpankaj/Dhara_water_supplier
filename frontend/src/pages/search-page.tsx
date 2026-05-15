import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const searchQuery = useQuery({
    queryKey: ["global-search", deferredQuery],
    enabled: deferredQuery.length >= 2,
    queryFn: async () => {
      const { data } = await api.get("/search/global", { params: { query: deferredQuery } });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Search"
        title="Global search"
        description="Search across clients, suppliers, invoices, payments, and products from one responsive finder."
      />
      <Card className="space-y-5">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice number, client, phone, or SKU..." />
        <div className="grid gap-4 xl:grid-cols-4">
          <ResultSection title="Contacts" items={searchQuery.data?.contacts || []} primaryKey="name" secondaryKey="phone" />
          <ResultSection title="Products" items={searchQuery.data?.products || []} primaryKey="name" secondaryKey="sku" />
          <ResultSection title="Invoices" items={searchQuery.data?.invoices || []} primaryKey="invoiceNumber" secondaryKey="amountDue" />
          <ResultSection title="Payments" items={searchQuery.data?.payments || []} primaryKey="referenceNo" secondaryKey="amount" />
        </div>
      </Card>
    </div>
  );
}

function ResultSection({
  title,
  items,
  primaryKey,
  secondaryKey,
}: {
  title: string;
  items: Array<Record<string, string | number>>;
  primaryKey: string;
  secondaryKey: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900">
      <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <div key={String(item.id || index)} className="rounded-2xl bg-white/80 p-3 dark:bg-slate-950/70">
            <p className="font-medium text-slate-900 dark:text-white">{String(item[primaryKey] || "Unknown")}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{String(item[secondaryKey] || "-")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

