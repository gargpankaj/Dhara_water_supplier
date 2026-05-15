import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/domain";

export function QuickSellPad({
  products,
  selectedProductId,
  onSelect,
}: {
  products: Product[];
  selectedProductId?: string;
  onSelect: (product: Product) => void;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tap to sell</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Optimized for fast delivery on mobile.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Button
            key={product.id}
            type="button"
            variant={selectedProductId === product.id ? "default" : "outline"}
            size="lg"
            className="h-auto flex-col items-start gap-2 rounded-2xl p-5 text-left"
            onClick={() => onSelect(product)}
          >
            <span className="text-lg font-bold">{product.name}</span>
            <span className="text-sm opacity-80">{formatCurrency(product.retail_price)}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}

