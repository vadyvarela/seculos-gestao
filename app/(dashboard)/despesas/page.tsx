"use client";

import { useEffect, useState, useMemo } from "react";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "@/app/api/actions";
import { Expense } from "@/lib/schema";
import { formatCurrency, EXPENSE_CATEGORIES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  stock: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  transporte: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  funcionario: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  aluguel: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  marketing: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  outros: "bg-muted text-muted-foreground border-border",
};

const emptyForm = {
  description: "",
  value: "",
  date: new Date().toISOString().split("T")[0],
  category: "outros",
  notes: "",
};

export default function DespesasPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("todos");

  const load = async () => {
    const data = await getExpenses();
    setExpenses(data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (categoryFilter === "todos") return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const totalGeral = expenses.reduce((s, e) => s + (Number(e.value) || 0), 0);
  const totalFiltrado = filtered.reduce((s, e) => s + (Number(e.value) || 0), 0);
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.category === c.value).reduce((s, e) => s + (Number(e.value) || 0), 0),
  }));

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      description: expense.description,
      value: String(expense.value),
      date: expense.date,
      category: expense.category,
      notes: expense.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const tid = toast.loading(editing ? "A atualizar..." : "A criar...");
    try {
      const payload = {
        description: form.description.trim(),
        value: parseFloat(form.value) || 0,
        date: form.date,
        category: form.category,
        notes: form.notes || null,
      };
      if (editing) {
        await updateExpense(editing.id, payload);
        toast.success("Despesa atualizada.", { id: tid });
      } else {
        await createExpense(payload);
        toast.success("Despesa criada.", { id: tid });
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      toast.error("Erro ao guardar despesa.", { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    const tid = toast.loading("A eliminar...");
    try {
      await deleteExpense(deleteId);
      setDeleteId(null);
      await load();
      toast.success("Despesa eliminada.", { id: tid });
    } catch {
      toast.error("Erro ao eliminar.", { id: tid });
    }
  };

  return (
    <div className="space-y-6">
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar despesa</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Despesas</h1>
          <p className="text-sm text-muted-foreground">Custos operacionais da loja</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          Nova
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total geral" value={formatCurrency(totalGeral)} color="red" />
        {byCategory.filter((c) => c.total > 0).slice(0, 3).map((c) => (
          <StatCard key={c.value} label={c.label} value={formatCurrency(c.total)} color="orange" />
        ))}
      </div>

      <Sheet open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <SheetContent title={editing ? "Editar despesa" : "Nova despesa"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                placeholder="Ex: Compra stock telemóveis"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="value">Valor *</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "A guardar..." : editing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader className="border-b border-border pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Lista de despesas</CardTitle>
              <CardDescription>
                {categoryFilter !== "todos"
                  ? `${filtered.length} · ${formatCurrency(totalFiltrado)}`
                  : `${expenses.length} despesa${expenses.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            {categoryFilter !== "todos" && (
              <Button variant="ghost" size="sm" onClick={() => setCategoryFilter("todos")} className="text-xs gap-1">
                <X className="size-3" /> Limpar
              </Button>
            )}
          </div>
          <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas categorias</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma despesa</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Valor</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(expense.date + "T00:00:00").toLocaleDateString("pt-PT")}
                    </TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs", CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.outros)}>
                        {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label ?? expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatCurrency(expense.value)}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(expense)}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
