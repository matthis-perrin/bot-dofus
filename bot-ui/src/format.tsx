export function formatScore(score: number, decimals = 1): string {
  return `${Math.round(score * 10 ** (2 + decimals)) / 10 ** decimals}%`;
}
