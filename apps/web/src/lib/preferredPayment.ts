/** Known preferred-payment method keys stored in counterparty.preferredPayment */
export const PREFERRED_PAYMENT_METHODS = ["qr", "link", "invoice_act", "edo"] as const;
export type PreferredPaymentMethod = (typeof PREFERRED_PAYMENT_METHODS)[number];

export const PREFERRED_PAYMENT_LABELS: Record<PreferredPaymentMethod, string> = {
  qr: "QR",
  link: "Ссылка",
  invoice_act: "Счёт и Акт",
  edo: "ЭДО",
};

export const PREFERRED_PAYMENT_COLORS: Record<PreferredPaymentMethod | "other", string> = {
  qr: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  link: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  invoice_act: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  edo: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const METHOD_SET = new Set<string>(PREFERRED_PAYMENT_METHODS);

export type ParsedPreferredPayment = {
  methods: Set<PreferredPaymentMethod>;
  /** null = «Другое» not selected; string (possibly empty) = selected */
  other: string | null;
};

/**
 * Parse preferredPayment.
 * Drops unknown tokens (old bugs appended invoice numbers / garbage).
 * `other:` comment is taken from the first `other:` at a comma boundary to end
 * so commas inside the comment are preserved.
 */
export function parsePreferredPayment(raw: string | null | undefined): ParsedPreferredPayment {
  const text = (raw ?? "").trim();
  const methods = new Set<PreferredPaymentMethod>();
  if (!text) return { methods, other: null };

  let other: string | null = null;
  let main = text;

  const otherIdx = text.search(/(?:^|,)other:/);
  if (otherIdx >= 0) {
    const start = text[otherIdx] === "," ? otherIdx + 1 : otherIdx;
    other = text.slice(start + "other:".length);
    main = text.slice(0, otherIdx).replace(/,\s*$/, "");
  }

  for (const part of main.split(",")) {
    const p = part.trim();
    if (METHOD_SET.has(p)) methods.add(p as PreferredPaymentMethod);
  }

  return { methods, other };
}

export function serializePreferredPayment(
  methods: Set<PreferredPaymentMethod> | PreferredPaymentMethod[],
  other: string | null
): string {
  const set = methods instanceof Set ? methods : new Set(methods);
  const parts: string[] = PREFERRED_PAYMENT_METHODS.filter((m) => set.has(m));
  if (other !== null) parts.push(`other:${other}`);
  return parts.join(",");
}

/** Normalize stored value: keep only known methods + one other comment. */
export function normalizePreferredPayment(raw: string | null | undefined): string | null {
  const { methods, other } = parsePreferredPayment(raw);
  const serialized = serializePreferredPayment(methods, other);
  return serialized || null;
}

export type PreferredPaymentBadge = {
  key: string;
  label: string;
  colorClass: string;
};

export function preferredPaymentBadges(raw: string | null | undefined): PreferredPaymentBadge[] {
  const { methods, other } = parsePreferredPayment(raw);
  const badges: PreferredPaymentBadge[] = PREFERRED_PAYMENT_METHODS.filter((m) => methods.has(m)).map((m) => ({
    key: m,
    label: PREFERRED_PAYMENT_LABELS[m],
    colorClass: PREFERRED_PAYMENT_COLORS[m],
  }));
  if (other !== null) {
    badges.push({
      key: "other",
      label: `Др.: ${other || "…"}`,
      colorClass: PREFERRED_PAYMENT_COLORS.other,
    });
  }
  return badges;
}
