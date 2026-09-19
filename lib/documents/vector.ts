export function toPgVector(values: readonly number[]): string {
  return JSON.stringify(values);
}
