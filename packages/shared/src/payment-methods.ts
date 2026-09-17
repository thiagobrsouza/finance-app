export const PAYMENT_METHODS = [
  { slug: "cash", name: "Dinheiro", requiresCreditCard: false },
  { slug: "debit", name: "Débito", requiresCreditCard: false },
  { slug: "credit", name: "Crédito", requiresCreditCard: true },
  { slug: "pix", name: "Pix", requiresCreditCard: false },
  { slug: "boleto", name: "Boleto", requiresCreditCard: false },
  { slug: "transfer", name: "Transferência", requiresCreditCard: false },
] as const;

export type PaymentMethodSlug = (typeof PAYMENT_METHODS)[number]["slug"];
