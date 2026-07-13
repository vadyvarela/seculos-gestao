"use client";

import { useEffect, useState } from "react";
import {
  listMyStores,
  createStore,
  renameStore,
} from "@/app/api/store-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type StoreRow = { id: number; name: string; createdAt: string };

export default function LojasPage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<StoreRow | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const data = await listMyStores();
    setStores(data);
  };

  useEffect(() => {
    load()
      .catch(() => toast.error("Sem permissão."))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createStore(name);
      toast.success("Loja criada.");
      setShowCreate(false);
      setName("");
      await load();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar loja.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await renameStore(editing.id, name);
      toast.success("Loja atualizada.");
      setEditing(null);
      setName("");
      await load();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao renomear.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Lojas</h1>
          <p className="text-sm text-muted-foreground">Criar e gerir as suas lojas</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setName("");
            setShowCreate(true);
          }}
        >
          <Plus className="size-4" />
          Nova loja
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">As suas lojas</CardTitle>
          <CardDescription>{stores.length} loja(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : stores.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma loja</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Nome</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Criada</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(s.createdAt).toLocaleDateString("pt-PT")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setEditing(s);
                          setName(s.name);
                        }}
                        aria-label="Renomear"
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova loja</DialogTitle>
            <DialogDescription>
              Após criar, pode adicionar um administrador só para essa loja em Utilizadores.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Nome</Label>
              <Input
                id="storeName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Loja Mindelo"
                required
                minLength={2}
                autoFocus
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
              <Button type="submit" disabled={submitting}>
                {submitting ? "A criar..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear loja</DialogTitle>
            <DialogDescription>Altere o nome visível no seletor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="renameStore">Nome</Label>
              <Input
                id="renameStore"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                autoFocus
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
              <Button type="submit" disabled={submitting}>
                {submitting ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
