const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/** "Jan 2024" — locale-independent, safe for SSR hydration */
export function formatMonthYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "January 2024" — locale-independent, safe for SSR hydration */
export function formatMonthYearLong(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
