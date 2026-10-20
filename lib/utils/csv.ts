/** Quotes a CSV cell; a leading = + - @ (or tab / CR) is neutralised so Excel doesn't run it as a formula. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV text with a BOM so Excel reads ₹ and other UTF-8 characters correctly. */
export function toCsv(header: string[], rows: string[][]): string {
  return "﻿" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
