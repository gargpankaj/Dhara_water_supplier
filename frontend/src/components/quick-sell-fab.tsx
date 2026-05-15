import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { QuickSellPad } from "@/components/quick-sell-pad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Contact, Product } from "@/types/domain";

export function QuickSellFab() {
  const [isOpen, setIsOpen] = useState(false);
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
        throw new Error("Select a bottle first");
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
    onSuccess: () => {
      toast.success("Quick sale completed");
      setIsOpen(false);
      setSelectedProduct(null);
      setQuantity(1);
      setClientId("");
    },
    onError: () => {
      toast.error("Quick sell could not be completed");
    },
  });

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="fixed bottom-24 right-4 z-40 rounded-full px-5 shadow-2xl shadow-blue-500/30 lg:bottom-8 lg:right-8"
        onClick={() => setIsOpen(true)}
      >
        <Zap className="mr-2 h-4 w-4" />
        Quick Sell
      </Button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end bg-slate-950/70 p-0 backdrop-blur-sm lg:items-center lg:justify-center lg:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full lg:max-w-5xl"
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
            >
              <Card className="max-h-[90vh] overflow-y-auto rounded-t-[2rem] border-slate-200/80 p-5 lg:rounded-[2rem] lg:p-6 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-300">
                      Quick sell mode
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Fast delivery checkout</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Pick the bottle, set quantity, choose the client, and finish the sale without leaving your current page.
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <QuickSellPad
                    products={productsQuery.data || []}
                    selectedProductId={selectedProduct?.id}
                    onSelect={(product) => setSelectedProduct(product)}
                  />
                  <div className="space-y-4">
                    <Card className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Order details</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Only the essential fields stay visible here for fast dispatch.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Quantity to deliver</label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="For example 20 bottles"
                          value={quantity}
                          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Enter the number of bottles going out in this quick order.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Client account</label>
                        <select
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50"
                          value={clientId}
                          onChange={(event) => setClientId(event.target.value)}
                        >
                          <option value="">Walk-in or cash client</option>
                          {clientsQuery.data?.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.full_name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Leave this as walk-in if the sale is cash and not tied to a saved CRM profile.</p>
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => quickSellMutation.mutate()}
                        disabled={quickSellMutation.isPending || !selectedProduct}
                      >
                        {quickSellMutation.isPending ? "Processing..." : "Complete quick sale"}
                      </Button>
                    </Card>
                    <Card className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Live summary</h4>
                      <div className="rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Selected bottle</p>
                        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{selectedProduct?.name || "Choose a bottle"}</p>
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Estimated total</p>
                        <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">
                          {formatCurrency((selectedProduct?.retail_price || 0) * quantity)}
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
