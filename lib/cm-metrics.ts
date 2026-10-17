export function comparisonLabel(current: number | null, previous: number | null): string {
  if (current === null || previous === null) return 'Comparaison partielle';
  if (previous === 0) return current === 0 ? '0 %' : 'Nouveau';
  const change = ((current - previous) / previous) * 100;
  return `${change.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}
