import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { QuickSellPad } from "@/components/quick-sell-pad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Contact, Product } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

export default function QuickSellPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [clientId, setClientId] = useState("");

  const productsQuery = useQuery({
    queryKey: ["quick-sell-products"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>("/products", {
        params: { category: "finished_good" },
      });
      return data;
    },
  });
  const clientsQuery = useQuery({
    queryKey: ["quick-sell-clients"],
    queryFn: async () => {
      const { data } = await api.get<Contact[]>("/clients");
      return data;
    },
  });
  const quickSellMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) {
        throw new Error("Select a product first");
      }
      return api.post("/invoices", {
        invoice_type: "sale",
        contact_id: clientId || null,
        invoice_date: new Date().toISOString().slice(0, 10),
        gst_enabled: false,
        discount_amount: 0,
        notes: "Quick sell",
        items: [
          {
            product_id: selectedProduct.id,
            description: selectedProduct.name,
            quantity,
            unit_price: selectedProduct.retail_price,
            tax_percent: 0,
          },
        ],
      });
    },
    onSuccess: () => toast.success("Quick sale completed"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quick sell"
        title="3-tap delivery mode"
        description="Pick the bottle, set quantity, choose the client, and finish delivery in a fast mobile-first workflow."
      />
      <QuickSellPad
        products={productsQuery.data || []}
        selectedProductId={selectedProduct?.id}
        onSelect={(product) => setSelectedProduct(product)}
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tap 2: quantity</h3>
          <Input type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter how many bottles you are delivering in this quick order.
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tap 3: client</h3>
          <select
            className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
          >
            <option value="">Walk-in / cash client</option>
            {clientsQuery.data?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Leave it on walk-in if the sale is cash and not tied to a saved client account.
          </p>
          <Button className="w-full" size="lg" onClick={() => quickSellMutation.mutate()} disabled={quickSellMutation.isPending}>
            {quickSellMutation.isPending ? "Processing..." : "Done"}
          </Button>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delivery summary</h3>
          <div className="rounded-2xl bg-slate-100/70 p-5 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Selected bottle</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{selectedProduct?.name || "Choose a bottle"}</p>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Total amount</p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">
              {formatCurrency((selectedProduct?.retail_price || 0) * quantity)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
