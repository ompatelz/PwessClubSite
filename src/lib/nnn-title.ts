// Display names for NNN issues. Kept free of imports so server routes and tests can use it.

export function formatNNNMonth(month: number | string) {
  const monthNumber = Number(month);

  if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
    return new Intl.DateTimeFormat("en", { month: "long" }).format(
      new Date(2000, monthNumber - 1, 1),
    );
  }

  return String(month);
}

export function nnnEditionTitle(edition: { Month: number | string; Year: number }) {
  return `${formatNNNMonth(edition.Month)} ${edition.Year}`;
}
