import { formatDate, formatCurrency } from "@/lib/utils";
import { Sale } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2, BadgeDollarSign, Phone, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { DraggableScroll } from "@/components/DraggableScroll";

interface StatCardProps {
  label: string;
  value: string | number;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "orange";
}

const borderColor: Record<string, string> = {
  blue: "border-l-blue-500",
  green: "border-l-emerald-500",
  red: "border-l-rose-500",
  yellow: "border-l-amber-500",
  purple: "border-l-violet-500",
  orange: "border-l-orange-500",
};

const valueColor: Record<string, string> = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  red: "text-rose-400",
  yellow: "text-amber-400",
  purple: "text-violet-400",
  orange: "text-orange-400",
};

export function StatCard({ label, value, color = "blue" }: StatCardProps) {
  return (
    <Card className={cn("border-l-4 gap-2 py-4", borderColor[color])}>
      <CardContent>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className={cn("mt-1.5 text-xsl md:text-2xl font-semibold tabular-nums", valueColor[color])}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  pago: {
    label: "Pago",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pendente;
  return (
    <Badge variant="outline" className={cn("font-medium", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

export function SalesTable({
  sales,
  onEdit,
  onDelete,
  onMarkPaid,
  onRowClick,
  onApplyCost,
  isAdmin = false,
}: {
  sales: Sale[];
  onEdit?: (sale: Sale) => void;
  onDelete?: (id: number) => void;
  onMarkPaid?: (id: number) => void;
  onRowClick?: (sale: Sale) => void;
  onApplyCost?: (sale: Sale) => void;
  isAdmin?: boolean;
}) {
  const dash = <span className="text-muted-foreground/30">—</span>;

  const totalQty = sales.reduce((s, o) => s + o.quantity, 0);
  const totalRevenue = sales.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const totalCost = sales.reduce((s, o) => s + (Number(o.cost) || 0), 0);
  const totalProfit = sales.reduce((s, o) => s + (Number(o.profit) || 0), 0);

  return (
    <DraggableScroll>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-xs text-muted-foreground uppercase tracking-wider">#</TableHead>
            <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">Produto/Serviço</TableHead>
            <TableHead className="w-14 text-xs text-muted-foreground uppercase tracking-wider">Qtd</TableHead>
            <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">Preço</TableHead>
            <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">Total</TableHead>
            {isAdmin && (
              <>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">Custo</TableHead>
                <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">Lucro</TableHead>
              </>
            )}
            <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-xs text-muted-foreground uppercase tracking-wider">Pagto</TableHead>
            <TableHead className="sticky right-0 bg-card text-xs text-muted-foreground uppercase tracking-wider shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.2)]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow
              key={sale.id}
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={() => onRowClick?.(sale)}
            >
              <TableCell className="text-muted-foreground font-medium">{sale.number}</TableCell>
              <TableCell className="font-medium text-foreground max-w-48 truncate">{sale.productService}</TableCell>
              <TableCell className="text-muted-foreground">{sale.quantity}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">{formatCurrency(sale.unitPrice)}</TableCell>
              <TableCell className="font-semibold text-foreground tabular-nums">{formatCurrency(sale.total)}</TableCell>
              {isAdmin && (
                <>
                  <TableCell className="text-muted-foreground tabular-nums">{formatCurrency(sale.cost)}</TableCell>
                  <TableCell className={cn("font-semibold tabular-nums", sale.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {formatCurrency(sale.profit)}
                  </TableCell>
                </>
              )}
              <TableCell className="text-muted-foreground">
                {sale.clientName ? (
                  <span className="inline-flex flex-col gap-0.5">
                    <span>{sale.clientName}</span>
                    {sale.clientPhone && (
                      <a
                        href={`tel:${sale.clientPhone}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="size-3" />
                        {sale.clientPhone}
                      </a>
                    )}
                  </span>
                ) : dash}
              </TableCell>
              <TableCell><StatusBadge status={sale.paymentStatus} /></TableCell>
              <TableCell className="sticky right-0 bg-card shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
                <TooltipProvider delay={200}>
                  <div className="flex gap-0.5">
                    {onApplyCost && isAdmin && !(Number(sale.unitCost) > 0 || Number(sale.cost) > 0) && (
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button variant="ghost" size="icon-xs" onClick={() => onApplyCost(sale)} aria-label="Aplicar custo"
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
                            <Coins />
                          </Button>
                        } />
                        <TooltipContent>Aplicar custo</TooltipContent>
                      </Tooltip>
                    )}
                    {onMarkPaid && sale.paymentStatus !== "pago" && (
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button variant="ghost" size="icon-xs" onClick={() => onMarkPaid(sale.id)} aria-label="Marcar como pago"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                            <BadgeDollarSign />
                          </Button>
                        } />
                        <TooltipContent>Marcar como pago</TooltipContent>
                      </Tooltip>
                    )}
                    {onEdit && (
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button variant="ghost" size="icon-xs" onClick={() => onEdit(sale)} aria-label="Editar">
                            <Pencil />
                          </Button>
                        } />
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button variant="ghost" size="icon-xs" onClick={() => onDelete(sale.id)} aria-label="Eliminar"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 />
                          </Button>
                        } />
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {sales.length > 0 && (
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td className="p-2 text-xs font-semibold text-muted-foreground" colSpan={2}>
                Totais
              </td>
              <td className="p-2 text-xs font-semibold text-foreground">{totalQty}</td>
              <td className="p-2" />
              <td className="p-2 text-xs font-semibold text-foreground tabular-nums">{formatCurrency(totalRevenue)}</td>
              {isAdmin && (
                <>
                  <td className="p-2 text-xs font-semibold text-foreground tabular-nums">{formatCurrency(totalCost)}</td>
                  <td className={cn("p-2 text-xs font-semibold tabular-nums", totalProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {formatCurrency(totalProfit)}
                  </td>
                </>
              )}
              <td colSpan={isAdmin ? 3 : 3} />
            </tr>
          </tfoot>
        )}
      </Table>
    </DraggableScroll>
  );
}

export function formatSaleDate(date: string | null | undefined) {
  return formatDate(date);
}
