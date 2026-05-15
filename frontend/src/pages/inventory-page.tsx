import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormFieldBlock } from "@/components/form-field-block";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/domain";

const productSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(2),
  category: z.enum(["raw_material", "finished_good", "premium"]),
  stock_quantity: z.coerce.number().min(0),
  low_stock_threshold: z.coerce.number().min(0),
  purchase_cost: z.coerce.number().min(0),
  wholesale_price: z.coerce.number().min(0),
  retail_price: z.coerce.number().min(0),
  distributor_price: z.coerce.number().min(0),
  premium_event_price: z.coerce.number().min(0),
});
const movementSchema = z.object({
  product_id: z.string().min(1),
  action: z.enum(["add", "remove", "transfer", "damaged", "adjustment"]),
  quantity: z.coerce.number().min(1),
  batch_number: z.string().optional(),
  unit_cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;
type MovementForm = z.infer<typeof movementSchema>;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await api.get<Product[]>("/products");
      return data;
    },
  });

  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      category: "finished_good",
      stock_quantity: 0,
      low_stock_threshold: 10,
      purchase_cost: 0,
      wholesale_price: 0,
      retail_price: 0,
      distributor_price: 0,
      premium_event_price: 0,
    },
  });
  const movementForm = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product_id: "",
      action: "add",
      quantity: 1,
      batch_number: "",
      unit_cost: 0,
      notes: "",
    },
  });

  const productMutation = useMutation({
    mutationFn: async (values: ProductForm) => api.post("/products", values),
    onSuccess: () => {
      toast.success("Product added");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      productForm.reset();
    },
  });
  const movementMutation = useMutation({
    mutationFn: async (values: MovementForm) => api.post("/inventory/movements", values),
    onSuccess: () => {
      toast.success("Stock updated");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      movementForm.reset();
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Multi-SKU stock management"
        description="Track raw materials, finished goods, damaged stock, transfers, and live low-stock risk from one operational board."
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create product or SKU</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Supports raw material, finished goods, and premium bottles.</p>
          </div>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={productForm.handleSubmit((values) => productMutation.mutate(values))}>
            <FormFieldBlock label="SKU code" hint="Unique stock code used for searching and billing." required>
              <Input placeholder="FG-1L-001" {...productForm.register("sku")} />
            </FormFieldBlock>
            <FormFieldBlock label="Product name" hint="Display name that staff will see in inventory and invoices." required>
              <Input placeholder="1L Bottle" {...productForm.register("name")} />
            </FormFieldBlock>
            <FormFieldBlock label="Product type" hint="Choose whether this is a raw material, finished bottle, or premium item." required>
              <select className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50" {...productForm.register("category")}>
                <option value="raw_material">Raw Material</option>
                <option value="finished_good">Finished Good</option>
                <option value="premium">Premium</option>
              </select>
            </FormFieldBlock>
            <FormFieldBlock label="Opening stock quantity" hint="How many units you currently have before new transactions start." required>
              <Input type="number" placeholder="250" {...productForm.register("stock_quantity")} />
            </FormFieldBlock>
            <FormFieldBlock label="Low stock alert level" hint="Show an alert when stock falls to this number or below." required>
              <Input type="number" placeholder="25" {...productForm.register("low_stock_threshold")} />
            </FormFieldBlock>
            <FormFieldBlock label="Purchase cost per unit" hint="What it costs you to buy or produce one unit." required>
              <Input type="number" step="0.01" placeholder="11.50" {...productForm.register("purchase_cost")} />
            </FormFieldBlock>
            <FormFieldBlock label="Wholesale selling price" hint="Price charged to bulk buyers or shops." required>
              <Input type="number" step="0.01" placeholder="16.00" {...productForm.register("wholesale_price")} />
            </FormFieldBlock>
            <FormFieldBlock label="Retail selling price" hint="Price charged to direct customers or walk-ins." required>
              <Input type="number" step="0.01" placeholder="18.00" {...productForm.register("retail_price")} />
            </FormFieldBlock>
            <FormFieldBlock label="Distributor price" hint="Price used when supplying distributors or resellers." required>
              <Input type="number" step="0.01" placeholder="15.00" {...productForm.register("distributor_price")} />
            </FormFieldBlock>
            <FormFieldBlock label="Premium event price" hint="Special price used for event or premium bottle orders." required>
              <Input type="number" step="0.01" placeholder="22.00" {...productForm.register("premium_event_price")} />
            </FormFieldBlock>
            <div className="md:col-span-2">
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Use this form to create a new raw material, bottled SKU, or premium event product.
              </p>
              <Button className="w-full" type="submit" disabled={productMutation.isPending}>
                {productMutation.isPending ? "Saving..." : "Add product"}
              </Button>
            </div>
          </form>
          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Stock movement</h3>
            <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={movementForm.handleSubmit((values) => movementMutation.mutate(values))}>
              <FormFieldBlock label="Which product?" hint="Select the raw material or bottle SKU you are updating." required>
                <select className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50" {...movementForm.register("product_id")}>
                  <option value="">Select product</option>
                  {productsQuery.data?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </FormFieldBlock>
              <FormFieldBlock label="What action happened?" hint="Choose whether stock was added, removed, transferred, damaged, or manually corrected." required>
                <select className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm dark:border-slate-800 dark:bg-slate-950/50" {...movementForm.register("action")}>
                  <option value="add">Add stock</option>
                  <option value="remove">Remove stock</option>
                  <option value="transfer">Transfer stock</option>
                  <option value="damaged">Damaged stock</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </FormFieldBlock>
              <FormFieldBlock label="Quantity moved" hint="How many units were added, removed, or adjusted in this action." required>
                <Input type="number" placeholder="20" {...movementForm.register("quantity")} />
              </FormFieldBlock>
              <FormFieldBlock label="Batch number" hint="Optional lot or production batch reference for traceability.">
                <Input placeholder="APR-LOT-12" {...movementForm.register("batch_number")} />
              </FormFieldBlock>
              <FormFieldBlock label="Unit cost" hint="Optional cost per unit for this particular stock movement.">
                <Input type="number" step="0.01" placeholder="11.50" {...movementForm.register("unit_cost")} />
              </FormFieldBlock>
              <FormFieldBlock label="Reason or notes" hint="Optional explanation, for example damaged in transit or warehouse transfer.">
                <Input placeholder="Damaged in transit" {...movementForm.register("notes")} />
              </FormFieldBlock>
              <div className="md:col-span-2">
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  Record stock adds, removals, transfers, damages, or manual corrections here.
                </p>
                <Button className="w-full" type="submit" disabled={movementMutation.isPending}>
                  {movementMutation.isPending ? "Updating..." : "Record movement"}
                </Button>
              </div>
            </form>
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Current inventory</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Low stock badges highlight immediate action items.</p>
            </div>
            <Badge tone="info">{productsQuery.data?.length || 0} items</Badge>
          </div>
          <div className="space-y-3">
            {productsQuery.data?.map((product) => (
              <div key={product.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {product.sku} • {product.category.replace("_", " ")}
                    </p>
                  </div>
                  <Badge tone={product.stock_quantity <= product.low_stock_threshold ? "warning" : "success"}>
                    {product.stock_quantity} in stock
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <MiniStat label="Purchase" value={formatCurrency(product.purchase_cost)} />
                  <MiniStat label="Retail" value={formatCurrency(product.retail_price)} />
                  <MiniStat label="Wholesale" value={formatCurrency(product.wholesale_price)} />
                  <MiniStat label="Premium" value={formatCurrency(product.premium_event_price)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
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
