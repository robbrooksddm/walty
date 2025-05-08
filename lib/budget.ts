// naïve daily budget tracker (resets on each server restart)
let spentCents = 0;
const DAILY_LIMIT_CENTS = Number(process.env.DAILY_BUDGET_CENTS ?? 1000); // £10 default

export function incCost(_provider: 'openai' | 'swap', units = 1) {
  // tweak multipliers when you know actual pricing
  const perUnitCents = _provider === 'openai' ? 5 : 2;
  spentCents += units * perUnitCents;
}

export function checkBudget() {
  return spentCents < DAILY_LIMIT_CENTS;
}