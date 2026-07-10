"use client";

import { useMemo, useState } from "react";
import { Sale, computeSaleAmounts } from "@/lib/schema";
import { PAYMENT_METHODS, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SaleFormData {
  productService: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  clientName: string;
  clientPhone: string;
  saleDate: string;
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
}

interface SaleFormProps {
  sale?: Sale;
  onSubmit: (data: SaleFormData) => Promise<void>;
  onCancel?: () => void;
  isAdmin?: boolean;
}

export function SaleForm({ sale, onSubmit, onCancel, isAdmin = false }: SaleFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productService: sale?.productService ?? "",
    quantity: sale?.quantity ?? 1,
    unitPrice: sale?.unitPrice ?? 0,
    unitCost: sale?.unitCost ?? 0,
    clientName: sale?.clientName ?? "",
    clientPhone: sale?.clientPhone ?? "",
    saleDate: sale?.saleDate ?? new Date().toISOString().split("T")[0],
    paymentStatus: sale?.paymentStatus ?? "pendente",
    paymentMethod: sale?.paymentMethod ?? "dinheiro",
    notes: sale?.notes ?? "",
  });

  const amounts = useMemo(
    () => computeSaleAmounts(formData.quantity, formData.unitPrice, formData.unitCost),
    [formData.quantity, formData.unitPrice, formData.unitCost]
  );

  const set = (field: string, value: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numeric = name === "quantity" || name === "unitPrice" || name === "unitCost";
    set(name, numeric ? (value ? parseFloat(value) : 0) : value);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        quantity: Number(formData.quantity) || 1,
        unitPrice: Number(formData.unitPrice) || 0,
        unitCost: Number(formData.unitCost) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="productService">Produto / Serviço *</Label>
            <Input
              id="productService"
              name="productService"
              value={formData.productService}
              onChange={handleChange}
              required
              placeholder="Ex: iPhone 13 128GB"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Qtd *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unitPrice">Preço *</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                value={formData.unitPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unitCost">Custo</Label>
              <Input
                id="unitCost"
                name="unitCost"
                type="number"
                value={formData.unitCost}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/40 px-4 py-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">Total</p>
              <p className="font-semibold tabular-nums text-right">{formatCurrency(amounts.total)}</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">Custo</p>
              <p className="font-semibold tabular-nums text-right">{formatCurrency(amounts.cost)}</p>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between gap-4 border-t border-border pt-2.5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">Lucro</p>
                <p className={`font-semibold tabular-nums text-right ${amounts.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {formatCurrency(amounts.profit)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="IMEI, garantia, notas..."
              className="resize-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="clientName">Cliente</Label>
            <Input
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientPhone">Telefone</Label>
            <Input
              id="clientPhone"
              name="clientPhone"
              type="tel"
              value={formData.clientPhone}
              onChange={handleChange}
              placeholder="Ex: 9881234"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="saleDate">Data da venda</Label>
            <Input
              id="saleDate"
              name="saleDate"
              type="date"
              value={formData.saleDate}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pagamento</Label>
              <Select value={formData.paymentStatus} onValueChange={(v) => v && set("paymentStatus", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Método</Label>
              <Select value={formData.paymentMethod} onValueChange={(v) => v && set("paymentMethod", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 pb-1 border-t border-border sticky bottom-0 bg-background">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : sale ? "Atualizar" : "Registar venda"}
        </Button>
      </div>
    </form>
  );
}
