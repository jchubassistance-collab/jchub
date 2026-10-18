export function comparisonLabel(current: number | null, previous: number | null): string {
  if (current === null || previous === null) return 'Comparaison partielle';
  if (previous === 0) return current === 0 ? '0 %' : 'Nouveau';
  const change = ((current - previous) / previous) * 100;
  return `${change.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

// Semaines complètes (lundi → dimanche, UTC) qui précèdent la date donnée, de la plus ancienne à la plus récente.
export function completedWeeks(now: Date, count = 1): Array<{ start: string; end: string }> {
  const total = Math.max(1, Math.min(12, Math.floor(count) || 1));
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const currentMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  currentMonday.setUTCDate(currentMonday.getUTCDate() - ((currentMonday.getUTCDay() || 7) - 1));
  const weeks: Array<{ start: string; end: string }> = [];
  for (let offset = total; offset >= 1; offset -= 1) {
    const start = new Date(currentMonday);
    start.setUTCDate(start.getUTCDate() - 7 * offset);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    weeks.push({ start: iso(start), end: iso(end) });
  }
  return weeks;
}
