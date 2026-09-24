/**
 * Accepts "98100 00001", "+91 98100-00001", "919810000001" etc.
 * Returns { phone: "+919810000001", whatsapp: "919810000001" } or null if invalid.
 */
export function normalizeIndianNumber(input: string): { phone: string; whatsapp: string } | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 11 || digits.length > 15) return null;
  return { phone: `+${digits}`, whatsapp: digits };
}
