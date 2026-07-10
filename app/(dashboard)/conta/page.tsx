"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/app/api/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function ContaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error("Nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      toast.success("Senha alterada. Faça login novamente.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Alterar senha</h1>
        <p className="text-sm text-muted-foreground">Atualize a sua senha de acesso</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nova senha</CardTitle>
          <CardDescription>Será necessário fazer login novamente após a alteração.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Senha atual</Label>
              <Input
                id="current"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">Nova senha</Label>
              <Input
                id="new"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <Input
                id="confirm"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "A guardar..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
