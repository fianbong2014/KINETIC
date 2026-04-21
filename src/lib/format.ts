// Number/currency formatters used across the terminal UI.

export function formatUsd(value: number, options?: { signed?: boolean }): string {
  const formatted = `$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  if (options?.signed) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatPct(value: number, options?: { signed?: boolean }): string {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  if (options?.signed) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().split("T")[0];
}
