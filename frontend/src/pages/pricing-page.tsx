import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormFieldBlock } from "@/components/form-field-block";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/domain";

const schema = z.object({
  product_id: z.string().min(1),
  wholesale_price: z.coerce.number().min(0),
  retail_price: z.coerce.number().min(0),
  distributor_price: z.coerce.number().min(0),
  premium_event_price: z.coerce.number().min(0),
  purchase_cost: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function PricingPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["products-pricing"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>("/products");
      return data;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: "",
      wholesale_price: 0,
      retail_price: 0,
      distributor_price: 0,
      premium_event_price: 0,
      purchase_cost: 0,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      api.patch(`/products/${values.product_id}/prices`, {
        wholesale_price: values.wholesale_price,
        retail_price: values.retail_price,
        distributor_price: values.distributor_price,
        premium_event_price: values.premium_event_price,
        purchase_cost: values.purchase_cost,
        effective_date: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Pricing updated");
      queryClient.invalidateQueries({ queryKey: ["products-pricing"] });
    },
  });

  const selectedProduct = productsQuery.data?.find((item) => item.id === form.watch("product_id"));
  const retailMargin =
    selectedProduct && form.watch("retail_price") > 0
      ? ((form.watch("retail_price") - form.watch("purchase_cost")) / form.watch("retail_price")) * 100
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pricing engine"
        title="Price manager"
        description="Update wholesale, retail, distributor, and premium event pricing with immediate history logging and margin visibility."
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Update pricing</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Choose a SKU, adjust the numbers, and push a new effective price set.</p>
          </div>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
            <FormFieldBlock label="Which product price do you want to change?" hint="Pick one SKU, then edit the selling prices for the different customer types." required>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50"
                {...form.register("product_id")}
                onChange={(event) => {
                  const product = productsQuery.data?.find((item) => item.id === event.target.value);
                  form.setValue("product_id", event.target.value);
                  form.setValue("wholesale_price", Number(product?.wholesale_price || 0));
                  form.setValue("retail_price", Number(product?.retail_price || 0));
                  form.setValue("distributor_price", Number(product?.distributor_price || 0));
                  form.setValue("premium_event_price", Number(product?.premium_event_price || 0));
                  form.setValue("purchase_cost", Number(product?.purchase_cost || 0));
                }}
              >
                <option value="">Select a product</option>
                {productsQuery.data?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </FormFieldBlock>
            <div className="grid gap-4 md:grid-cols-2">
              <FormFieldBlock label="Purchase cost" hint="Your internal cost for one unit. Used to estimate margin." required>
                <Input type="number" step="0.01" placeholder="11.50" {...form.register("purchase_cost")} />
              </FormFieldBlock>
              <FormFieldBlock label="Retail price" hint="Selling price for direct customers or walk-in orders." required>
                <Input type="number" step="0.01" placeholder="18.00" {...form.register("retail_price")} />
              </FormFieldBlock>
              <FormFieldBlock label="Wholesale price" hint="Selling price for larger bulk orders." required>
                <Input type="number" step="0.01" placeholder="16.00" {...form.register("wholesale_price")} />
              </FormFieldBlock>
              <FormFieldBlock label="Distributor price" hint="Selling price for distributors and partner channels." required>
                <Input type="number" step="0.01" placeholder="15.00" {...form.register("distributor_price")} />
              </FormFieldBlock>
              <FormFieldBlock label="Premium event price" hint="Special selling price used for event and premium bookings." required>
                <Input type="number" step="0.01" placeholder="22.00" {...form.register("premium_event_price")} />
              </FormFieldBlock>
            </div>
            <div className="rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Estimated retail margin</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{retailMargin.toFixed(1)}%</p>
            </div>
            <Button className="w-full" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Apply new pricing"}
            </Button>
          </form>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Current pricing matrix</h3>
          <div className="space-y-3">
            {productsQuery.data?.map((product) => (
              <div key={product.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{product.sku}</p>
                  </div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-300">{formatCurrency(product.retail_price)}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniStat label="Wholesale" value={product.wholesale_price} />
                  <MiniStat label="Distributor" value={product.distributor_price} />
                  <MiniStat label="Premium" value={product.premium_event_price} />
                  <MiniStat label="Cost" value={product.purchase_cost} />
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
