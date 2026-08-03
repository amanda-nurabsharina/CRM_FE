export function formatPhoneNumber(phone?: string): string {
  if (!phone) return "-";

  let clean = phone.replace(/^[^\d+]+/, "").replace(/[^0-9]/g, "").trim();
  if (!clean) return phone;

  if (clean.startsWith("08")) {
    clean = "628" + clean.slice(2);
  }

  if (clean.startsWith("628") && clean.length >= 10 && clean.length <= 14) {
    return `+62 ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`;
  }

  if (clean.startsWith("62") && clean.length >= 10) {
    return `+62 ${clean.slice(2, 5)}-${clean.slice(5, 9)}${clean.length > 9 ? "-" + clean.slice(9) : ""}`;
  }

  if (clean.length >= 8 && clean.length <= 15) {
    return `+${clean.slice(0, 3)} ${clean.slice(3, 7)}-${clean.slice(7)}`;
  }

  return `+${clean}`;
}

export function formatCustomerName(name?: string): string {
  if (!name) return "Pelanggan";
  let clean = name
    .replace(/WhatsApp Call \(\+?\d+\)/gi, "Pelanggan (Panggilan WA)")
    .replace(/WA User \(\+?\d+\)/gi, "Pelanggan WA")
    .trim();
  return clean || "Pelanggan";
}

export function formatCurrency(amount?: number): string {
  if (!amount) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
