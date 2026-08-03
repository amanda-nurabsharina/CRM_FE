export function formatPhoneNumber(phone?: string): string {
  if (!phone) return "No Number";

  const clean = phone.trim().replace(/[^0-9]/g, "");

  // Standard Indonesian Mobile (e.g. 6281234567890)
  if (clean.startsWith("628") && clean.length >= 10 && clean.length <= 13) {
    return `+62 ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`;
  }

  // Local Indonesian Mobile (e.g. 081234567890)
  if (clean.startsWith("08") && clean.length >= 10 && clean.length <= 13) {
    return `+62 ${clean.slice(1, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
  }

  // WhatsApp Internal LID (e.g. 71705116557547)
  if (clean.length > 13 || (!clean.startsWith("62") && !clean.startsWith("08"))) {
    return `WA ID: ${clean}`;
  }

  return `+${clean}`;
}
