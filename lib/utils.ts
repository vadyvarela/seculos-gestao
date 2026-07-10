import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-CV", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatCurrency(value: number, currency = "CVE", locale = "pt-PT"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  }).format(value);
}

const MONTH_NAMES: Record<string, string> = {
  JANEIRO: "Janeiro",
  FEVEREIRO: "Fevereiro",
  MARCO: "Março",
  ABRIL: "Abril",
  MAIO: "Maio",
  JUNHO: "Junho",
  JULHO: "Julho",
  AGOSTO: "Agosto",
  SETEMBRO: "Setembro",
  OUTUBRO: "Outubro",
  NOVEMBRO: "Novembro",
  DEZEMBRO: "Dezembro",
};

const MONTH_KEYS = [
  "JANEIRO", "FEVEREIRO", "MARCO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

export function getMonthName(key: string): string {
  return MONTH_NAMES[key?.toUpperCase()] ?? key;
}

export function getCurrentMonth(): string {
  return MONTH_KEYS[new Date().getMonth()];
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "cartao", label: "Cartão" },
  { value: "outros", label: "Outros" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "stock", label: "Stock / Fornecedor" },
  { value: "transporte", label: "Transporte" },
  { value: "funcionario", label: "Funcionário" },
  { value: "aluguel", label: "Aluguel" },
  { value: "marketing", label: "Marketing" },
  { value: "outros", label: "Outros" },
] as const;

export function categoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function paymentMethodLabel(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}
