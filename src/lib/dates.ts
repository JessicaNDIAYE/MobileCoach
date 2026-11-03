/** Date locale au format YYYY-MM-DD (ce que Postgres attend pour une colonne `date`). */
export function toISODate(d: Date = new Date()): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export const today = () => toISODate();

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);
}

export const monthStart = () => `${today().slice(0, 7)}-01`;

export const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export const eur = (n: number) =>
  (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
