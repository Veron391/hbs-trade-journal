export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function addDays(d: Date, n: number): Date {
  const newDate = new Date(d);
  newDate.setDate(d.getDate() + n);
  return newDate;
}