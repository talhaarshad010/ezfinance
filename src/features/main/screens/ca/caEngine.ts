import type {
  UserBill,
  UserGoal,
  UserHolding,
  UserTx,
} from '../../../../context/UserModeContext';
import type { BudgetCategory } from '../../../../store/slices/budgetSlice';
import type { BankAccount } from '../../../../store/slices/bankAccountsSlice';
import type { DebtEntry } from '../../../../constants/ledgerData';
import type { CustomMemoryMap } from './memoryStore';
import { computeUserDashboard } from '../dashboard/userDashboard';
import { monthlyIncomeOf } from '../../../../utils/income';
import { fullAmt } from '../../../../utils/format';
import { detectLanguage, normalizeLocal, type CaLanguage } from './caLanguage';
import {
  extractExecutableActions,
  normalizeFact,
  parsePkrNumber,
  type CaExecutableAction,
} from './caActions';

export {
  inferTransactionCategory,
  parsePkrNumber,
  type CaExecutableAction,
  type ValidTxCategory,
} from './caActions';

/**
 * ============================================================================
 * EZFINANCE — PERSONAL CA & CROSS-APP MEMORY BANK ENGINE (FYP CORE MODULE)
 * ============================================================================
 *
 * This module implements the Neuro-Symbolic Financial Reasoning Engine:
 *   1. Cross-App Memory Aggregation (`buildCrossAppMemory`):
 *      Synthesizes live state from Profile, Bank Accounts, Transactions,
 *      Savings Goals, Budgets/Envelopes, Loans, Bills, and Custom Memory.
 *   2. Auto-Memory Fact Extraction (`extractFactsFromMessage`):
 *      Detects personal facts shared in natural language chat and persists
 *      them into the Memory Bank.
 *   3. Deterministic Pakistani CA Calculators:
 *      - FBR Finance Act 2024–25 Salaried Tax Slabs & Section 62 Tax Credit
 *      - Goal & Target Amount Savings Optimizer (Category Trim Simulation)
 *      - Zakat (2.5% Nisab & Net Zakatable Liquid Wealth Calculator)
 *      - Risk-Adjusted SECP Mutual Fund & KSE-100 Allocation Engine
 *   4. LLM Prompt Context Serializer (`serializeMemoryForLlm`):
 *      Formats verified numbers into a structured prompt so the AI model
 *      never hallucinates arithmetic.
 */

export type CaSeg = { t: string; tone?: 'red' | 'green' };

export interface MemoryBankRow {
  k: string;
  v: string;
  isCustom?: boolean;
  editable?: boolean;
}

export interface GoalAnalysis {
  name: string;
  target: number;
  saved: number;
  remaining: number;
  monthsLeft: number | null;
  requiredPerMonth: number;
}

export interface CategorySpendItem {
  category: string;
  amount: number;
  limit: number | null;
  isDiscretionary: boolean;
  suggestedCut: number;
}

export interface CrossAppFinancialSnapshot {
  userName: string;
  monthlyIncome: number;
  annualIncome: number;
  thisMonthSpent: number;
  avgMonthlySpend: number;
  recurringBillsTotal: number;
  monthlyLoanEmi: number;
  totalDebtRemaining: number;
  totalLiquidCash: number;
  totalInvested: number;
  netWorth: number;
  monthlySurplus: number;
  savingsRatePct: number;
  budgetLimit: number | null;
  filerStatus: 'filer' | 'non_filer' | 'unsure';
  city: string;
  employer: string;
  riskScore: string;
  dependents: string;
  sec62Used: number;
  categories: CategorySpendItem[];
  potentialMonthlyCut: number;
  optimizedMonthlySavings: number;
  goals: GoalAnalysis[];
  bankAccounts: { name: string; balance: number }[];
  customFacts: Record<string, string>;
  memoryRows: MemoryBankRow[];
}

export interface CaEngineInput {
  profile: {
    uid?: string | null;
    name?: string | null;
    monthlyIncome?: string | null;
    city?: string | null;
    province?: string | null;
    filerStatus?: string | null;
  } | null;
  txs: UserTx[];
  goals: UserGoal[];
  holdings: UserHolding[];
  budget: number | null;
  envelopes: BudgetCategory[];
  bankAccounts: BankAccount[];
  bills: UserBill[];
  debts: DebtEntry[];
  customMemory: CustomMemoryMap;
}

export const NOT_ADDED = 'Not added yet';

/** Essential categories ("Needs"); other categories are treated as flexible ("Wants") for savings optimization. */
const ESSENTIAL_CATEGORIES = new Set([
  'Groceries',
  'Fuel',
  'Bills',
  'Utilities',
  'Housing',
  'Healthcare',
]);

// ============================================================================
// STEP 1: CROSS-APP MEMORY AGGREGATOR
// ============================================================================

export function buildCrossAppMemory(
  input: CaEngineInput,
): CrossAppFinancialSnapshot {
  const {
    profile,
    txs,
    goals,
    holdings,
    budget,
    envelopes,
    bankAccounts,
    bills,
    debts,
    customMemory,
  } = input;
  const facts = customMemory.facts || {};

  const accountBalances = bankAccounts.map(a => a.balance);
  const dash = computeUserDashboard({
    txs,
    goals,
    holdings,
    budget,
    envelopes,
    accountBalances,
    profileIncome: monthlyIncomeOf(profile?.monthlyIncome),
    debts,
  });

  // Allow user to override Salary in Memory Bank if they edited it
  const salaryOverride = parsePkrNumber(facts.Salary);
  const monthlyIncome = salaryOverride ?? dash.income;
  const annualIncome = monthlyIncome * 12;

  const thisMonthSpent = dash.spent;
  const activeMonths = dash.months.filter(m => m.outflow > 0);
  const avgMonthlySpend =
    activeMonths.length > 0
      ? Math.round(
          activeMonths.reduce((s, m) => s + m.outflow, 0) / activeMonths.length,
        )
      : thisMonthSpent;
  const recurringBillsTotal = bills.reduce((sum, b) => sum + b.amount, 0);
  const monthlyLoanEmi = debts.reduce((sum, d) => sum + d.emi, 0);
  const totalDebtRemaining = debts.reduce((sum, d) => sum + d.remaining, 0);

  // Committed monthly outflow = max of actual spend or recurring bills + EMIs
  const effectiveMonthlyOutflow =
    Math.max(thisMonthSpent, avgMonthlySpend) + monthlyLoanEmi;
  const monthlySurplus = Math.max(0, monthlyIncome - effectiveMonthlyOutflow);
  const savingsRatePct =
    monthlyIncome > 0
      ? Math.round(
          ((monthlyIncome - effectiveMonthlyOutflow) / monthlyIncome) * 1000,
        ) / 10
      : 0;

  // Analyze categories & identify where the user can cut spending to save more
  const categories: CategorySpendItem[] = dash.categories.map(c => {
    const isDiscretionary = !ESSENTIAL_CATEGORIES.has(c.label);
    const overLimit = c.limit && c.spent > c.limit ? c.spent - c.limit : 0;
    // Suggest 25% cut on discretionary categories, or 10% efficiency cut on essentials if needed
    const suggestedCut =
      overLimit > 0
        ? overLimit
        : isDiscretionary
        ? Math.round(c.spent * 0.25)
        : Math.round(c.spent * 0.08);
    return {
      category: c.label,
      amount: c.spent,
      limit: c.limit,
      isDiscretionary,
      suggestedCut,
    };
  });

  const potentialMonthlyCut = categories.reduce(
    (s, c) => s + c.suggestedCut,
    0,
  );
  const optimizedMonthlySavings = monthlySurplus + potentialMonthlyCut;

  // Analyze active savings goals
  const now = new Date();
  const goalAnalyses: GoalAnalysis[] = goals.map(g => {
    const remaining = Math.max(0, g.target - g.saved);
    let monthsLeft: number | null = null;
    if (g.deadline) {
      const diffMs = g.deadline.getTime() - now.getTime();
      monthsLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
    }
    const requiredPerMonth = monthsLeft
      ? Math.ceil(remaining / monthsLeft)
      : Math.ceil(remaining / 6);
    return {
      name: g.name,
      target: g.target,
      saved: g.saved,
      remaining,
      monthsLeft,
      requiredPerMonth,
    };
  });

  // Resolve Memory Bank fields (combining Profile, App Data, and User Overrides)
  const rawFiler = (
    facts['Tax Profile'] ||
    profile?.filerStatus ||
    ''
  ).toLowerCase();
  const filerStatus: 'filer' | 'non_filer' | 'unsure' =
    rawFiler.includes('non') || rawFiler === 'no'
      ? 'non_filer'
      : rawFiler.includes('filer') || rawFiler === 'yes'
      ? 'filer'
      : 'unsure';

  const taxProfileDisplay =
    facts['Tax Profile'] ||
    (filerStatus === 'filer'
      ? 'Salaried · FBR Filer'
      : filerStatus === 'non_filer'
      ? 'Salaried · Non-Filer'
      : NOT_ADDED);

  const cityDisplay =
    facts.City ||
    [profile?.city, profile?.province].filter(Boolean).join(', ') ||
    NOT_ADDED;

  const employerDisplay = facts.Employer || NOT_ADDED;
  const riskScoreDisplay = facts['Risk Score'] || NOT_ADDED;
  const dependentsDisplay = facts.Dependents || NOT_ADDED;
  const sec62Used = parsePkrNumber(facts['Sec 62 Used']) ?? 0;
  const sec62Display =
    facts['Sec 62 Used'] ||
    (sec62Used > 0 ? `PKR ${fullAmt(sec62Used)} this FY` : NOT_ADDED);

  const goalsDisplay =
    facts.Goals ||
    (goalAnalyses.length > 0
      ? goalAnalyses
          .map(g => `${g.name} (PKR ${fullAmt(g.saved)}/${fullAmt(g.target)})`)
          .join(' · ')
      : NOT_ADDED);

  const memoryRows: MemoryBankRow[] = [
    {
      k: 'Salary',
      v: monthlyIncome > 0 ? `PKR ${fullAmt(monthlyIncome)} / mo` : NOT_ADDED,
      editable: true,
    },
    { k: 'Employer', v: employerDisplay, editable: true },
    { k: 'Tax Profile', v: taxProfileDisplay, editable: true },
    { k: 'Risk Score', v: riskScoreDisplay, editable: true },
    { k: 'City', v: cityDisplay, editable: true },
    { k: 'Dependents', v: dependentsDisplay, editable: true },
    { k: 'Goals', v: goalsDisplay, editable: true },
    { k: 'Sec 62 Used', v: sec62Display, editable: true },
    {
      k: 'Liquid Cash',
      v:
        dash.cash > 0
          ? `PKR ${fullAmt(dash.cash)} (${bankAccounts.length} acct${
              bankAccounts.length === 1 ? '' : 's'
            })`
          : 'PKR 0',
      editable: false,
    },
    {
      k: 'Monthly Spend',
      v:
        thisMonthSpent > 0
          ? `PKR ${fullAmt(thisMonthSpent)} (${txs.length} txs)`
          : 'PKR 0 this month',
      editable: false,
    },
  ];

  // Append custom user-added context rows
  for (const key of customMemory.customKeys) {
    if (
      facts[key] &&
      !memoryRows.some(r => r.k.toLowerCase() === key.toLowerCase())
    ) {
      memoryRows.push({
        k: key,
        v: facts[key],
        isCustom: true,
        editable: true,
      });
    }
  }

  return {
    userName: profile?.name?.trim().split(' ')[0] || 'there',
    monthlyIncome,
    annualIncome,
    thisMonthSpent,
    avgMonthlySpend,
    recurringBillsTotal,
    monthlyLoanEmi,
    totalDebtRemaining,
    totalLiquidCash: dash.cash,
    totalInvested: dash.invested,
    netWorth: dash.netWorth,
    monthlySurplus,
    savingsRatePct,
    budgetLimit: budget,
    filerStatus,
    city: cityDisplay,
    employer: employerDisplay,
    riskScore: riskScoreDisplay,
    dependents: dependentsDisplay,
    sec62Used,
    categories,
    potentialMonthlyCut,
    optimizedMonthlySavings,
    goals: goalAnalyses,
    bankAccounts: bankAccounts.map(a => ({
      name: a.bankName,
      balance: a.balance,
    })),
    customFacts: facts,
    memoryRows,
  };
}

// ============================================================================
// STEP 2: DETERMINISTIC PAKISTANI CA CALCULATORS (YOUR CORE CONTRIBUTION)
// ============================================================================

// Finance Act 2024–25 (Tax Year 2025) slabs for salaried individuals: [from, base tax, rate].
const FBR_SLABS: [number, number, number][] = [
  [600_000, 0, 0.05],
  [1_200_000, 30_000, 0.15],
  [2_200_000, 180_000, 0.25],
  [3_200_000, 430_000, 0.3],
  [4_100_000, 700_000, 0.35],
];

export function computeAnnualSalariedTax(annual: number): number {
  const slab = [...FBR_SLABS].reverse().find(([from]) => annual > from);
  const baseTax = slab ? slab[1] + (annual - slab[0]) * slab[2] : 0;
  // Surcharge of 10% applies on salaried income exceeding PKR 10 Million under Finance Act 2024
  return annual > 10_000_000 ? baseTax * 1.1 : baseTax;
}

/**
 * 2A. FBR Tax & Section 62 Tax Credit Calculator
 * Uses the user's real salary, Filer status, and Sec 62 Used from the Memory Bank.
 */
export function buildTaxEstimateResponse(
  snap: CrossAppFinancialSnapshot,
  customMonthlySalary?: number,
): CaSeg[] {
  const monthly = customMonthlySalary ?? snap.monthlyIncome;
  if (monthly <= 0) {
    return [
      {
        t: `I don't have your monthly salary in the Memory Bank yet.\n\nTap `,
      },
      { t: 'Memory → Salary', tone: 'green' },
      {
        t: ` at the top right (or tell me e.g. "My salary is PKR 1,50,000") and I will calculate your exact FBR Finance Act 2024–25 withholding tax and Section 62 tax credit.`,
      },
    ];
  }

  const annual = monthly * 12;
  const tax = Math.round(computeAnnualSalariedTax(annual));
  if (tax === 0) {
    return [
      {
        t: `Based on your monthly income of PKR ${fullAmt(
          monthly,
        )} (Annual: PKR ${fullAmt(
          annual,
        )}):\n\nYour income falls within the PKR 6,00,000 exempt threshold under Finance Act 2024–25, so `,
      },
      { t: 'PKR 0 income tax is due', tone: 'green' },
      { t: '.' },
    ];
  }

  const bounds = [
    0,
    600_000,
    1_200_000,
    2_200_000,
    3_200_000,
    4_100_000,
    Infinity,
  ];
  const rates = [0, 0.05, 0.15, 0.25, 0.3, 0.35];
  const lines: string[] = [];
  for (let i = 0; i < rates.length && annual > bounds[i]; i++) {
    const top = Math.min(annual, bounds[i + 1]);
    const from = i === 0 ? 'First' : `PKR ${fullAmt(bounds[i] + 1)}–`;
    lines.push(
      i === 0
        ? `• First PKR ${fullAmt(top)} — exempt`
        : `• ${from}${fullAmt(top)} — ${rates[i] * 100}% → PKR ${fullAmt(
            (top - bounds[i]) * rates[i],
          )}`,
    );
  }

  // Section 62: credit at average tax rate on investment up to 20% of taxable income (max PKR 20,00,000).
  const maxEligible = Math.min(annual * 0.2, 2_000_000);
  const remainingEligible = Math.max(0, maxEligible - snap.sec62Used);
  const totalCredit = Math.round((tax / annual) * maxEligible);
  const remainingCredit = Math.round((tax / annual) * remainingEligible);
  const netMonthlyTax = Math.round((tax - totalCredit) / 12);

  const sec62Note =
    snap.sec62Used > 0
      ? `\n\nMemory Bank shows you already invested PKR ${fullAmt(
          snap.sec62Used,
        )} under Sec 62. Investing the remaining PKR ${fullAmt(
          remainingEligible,
        )} in SECP-approved funds saves an additional `
      : `\n\nInvesting up to PKR ${fullAmt(
          maxEligible,
        )} in SECP-approved mutual funds/VPS reduces your annual tax by `;

  return [
    {
      t: `Under Finance Act 2024–25 slab rates for salaried individuals (${
        snap.filerStatus === 'non_filer'
          ? 'Non-Filer — double WHT on banking/assets applies'
          : 'FBR Filer'
      }):\n\nAnnual income: PKR ${fullAmt(annual)}\n${lines.join(
        '\n',
      )}\n\nTotal annual WHT: PKR ${fullAmt(tax)}\nMonthly WHT: `,
    },
    { t: `PKR ${fullAmt(Math.round(tax / 12))}`, tone: 'red' },
    {
      t: `\nEffective rate: ${((tax / annual) * 100).toFixed(2)}%${sec62Note}`,
    },
    {
      t: `PKR ${fullAmt(snap.sec62Used > 0 ? remainingCredit : totalCredit)}`,
      tone: 'green',
    },
    {
      t: ` via Section 62 credit (bringing effective monthly tax down to PKR ${fullAmt(
        netMonthlyTax,
      )}).`,
    },
  ];
}

/**
 * 2B. Savings Plan & Goal Feasibility Calculator
 * Analyzes the user's real income, category spending, bank balance, and goals to build a concrete numeric plan.
 */
export function buildSavingsPlanResponse(
  snap: CrossAppFinancialSnapshot,
  targetAmountFromQuery?: number | null,
  matchedGoal?: GoalAnalysis | null,
): CaSeg[] {
  const goal = matchedGoal ?? (snap.goals.length > 0 ? snap.goals[0] : null);
  const targetAmount =
    targetAmountFromQuery ??
    (goal
      ? goal.remaining
      : snap.monthlyIncome > 0
      ? Math.round(snap.monthlyIncome * 0.25)
      : 50_000);
  const targetLabel = targetAmountFromQuery
    ? `PKR ${fullAmt(targetAmount)}`
    : goal
    ? `${goal.name} (PKR ${fullAmt(goal.remaining)} remaining of PKR ${fullAmt(
        goal.target,
      )})`
    : `PKR ${fullAmt(targetAmount)}`;

  if (
    snap.monthlyIncome <= 0 &&
    snap.thisMonthSpent <= 0 &&
    snap.totalLiquidCash <= 0
  ) {
    return [
      {
        t: `To calculate an exact savings plan for ${targetLabel}, I need your income or expense data.\n\n• Add your monthly salary in `,
      },
      { t: 'Memory → Salary', tone: 'green' },
      {
        t: `\n• Or log your income/expenses in the Expenses tab so I can analyze your real numbers.`,
      },
    ];
  }

  // Top spending categories & suggested cuts
  const topCats = snap.categories.slice(0, 3);
  const catBreakdownLines =
    topCats.length > 0
      ? topCats
          .map(
            c =>
              `• ${c.category}: PKR ${fullAmt(
                c.amount,
              )} spent → trim by PKR ${fullAmt(c.suggestedCut)}/mo`,
          )
          .join('\n')
      : `• No expense categories logged this month yet`;

  const currentSurplus = snap.monthlySurplus;
  const achievableMonthly = Math.max(
    currentSurplus + snap.potentialMonthlyCut,
    Math.round(snap.monthlyIncome * 0.2),
  );
  const monthsAtCurrent =
    currentSurplus > 0 ? Math.ceil(targetAmount / currentSurplus) : null;
  const monthsOptimized =
    achievableMonthly > 0
      ? Math.max(1, Math.ceil(targetAmount / achievableMonthly))
      : null;

  return [
    {
      t: `Here is your personalized savings calculation for ${targetLabel} based on your Memory Bank & live ledger:\n\n1. Current Cashflow Position:\n• Monthly Income: PKR ${fullAmt(
        snap.monthlyIncome,
      )}\n• Monthly Spend & Bills: `,
    },
    {
      t: `PKR ${fullAmt(snap.thisMonthSpent + snap.monthlyLoanEmi)}`,
      tone: 'red',
    },
    {
      t: `\n• Current Net Surplus: PKR ${fullAmt(currentSurplus)} / mo (${
        snap.savingsRatePct
      }% savings rate)\n• Liquid Bank Balance: PKR ${fullAmt(
        snap.totalLiquidCash,
      )}\n\n2. Category Optimization (${
        topCats.length > 0 ? 'This Month' : 'Ledger'
      }):\n${catBreakdownLines}\n\n3. Actionable Target Plan:\nBy trimming discretionary spend, your monthly saving capacity increases to `,
    },
    { t: `PKR ${fullAmt(achievableMonthly)} / mo`, tone: 'green' },
    {
      t: `.\n• Time to reach PKR ${fullAmt(targetAmount)}: `,
    },
    {
      t: monthsOptimized
        ? `${monthsOptimized} month${monthsOptimized === 1 ? '' : 's'}${
            monthsAtCurrent && monthsAtCurrent > monthsOptimized
              ? ` (down from ${monthsAtCurrent} months)`
              : ''
          }`
        : 'Add monthly income to compute timeline',
      tone: 'green',
    },
    {
      t: `\n• Tip: Park your monthly surplus in an SECP Shariah Cash Fund (~17–19% p.a. return) to compound your goal faster.`,
    },
  ];
}

/**
 * 2C. Zakat Calculator on User's Live Wealth
 * Uses bank account balances, investment holdings, and deducts immediate liabilities.
 */
export function buildZakatResponse(snap: CrossAppFinancialSnapshot): CaSeg[] {
  // Approximate Silver Nisab threshold in Pakistan (~52.5 Tola silver)
  const SILVER_NISAB_PKR = 165_000;
  const grossZakatable = snap.totalLiquidCash + snap.totalInvested;
  const immediateDeductions = snap.monthlyLoanEmi + snap.recurringBillsTotal;
  const netZakatable = Math.max(0, grossZakatable - immediateDeductions);
  const zakatDue = Math.round(netZakatable * 0.025);

  if (grossZakatable <= 0) {
    return [
      {
        t: `Your Memory Bank currently shows PKR 0 in linked Bank Accounts and Investments.\n\nLink your bank accounts in the Bank Accounts screen (or add your Gold/Cash holdings in `,
      },
      { t: 'Memory → + Add Context', tone: 'green' },
      {
        t: `) and I will compute your exact 2.5% Zakat liability against the current Nisab threshold (PKR ${fullAmt(
          SILVER_NISAB_PKR,
        )}).`,
      },
    ];
  }

  const aboveNisab = netZakatable >= SILVER_NISAB_PKR;

  return [
    {
      t: `Zakat Assessment from your live EzFinance accounts & holdings:\n\n• Liquid Bank Balances: PKR ${fullAmt(
        snap.totalLiquidCash,
      )}\n• Investment Holdings: PKR ${fullAmt(
        snap.totalInvested,
      )}\n• Less Immediate Due Liabilities (EMI/Bills): -PKR ${fullAmt(
        immediateDeductions,
      )}\n• Net Zakatable Wealth: PKR ${fullAmt(
        netZakatable,
      )}\n• Silver Nisab Threshold (52.5 Tola): PKR ${fullAmt(
        SILVER_NISAB_PKR,
      )}\n\n`,
    },
    ...(aboveNisab
      ? ([
          { t: 'Zakat Payable (2.5%): ' },
          { t: `PKR ${fullAmt(zakatDue)}`, tone: 'green' as const },
          {
            t: `\n\nNote: If Zakat was already deducted at source on bank profit/mutual funds, subtract that certificate amount from PKR ${fullAmt(
              zakatDue,
            )}.`,
          },
        ] as CaSeg[])
      : ([
          {
            t: `Your net liquid wealth (PKR ${fullAmt(
              netZakatable,
            )}) is currently below the Silver Nisab threshold, so `,
          },
          { t: 'PKR 0 obligatory Zakat is due', tone: 'green' as const },
          { t: ' right now.' },
        ] as CaSeg[])),
  ];
}

/**
 * 2D. Shariah AMC & KSE-100 Investment Strategy
 * Tailored to the user's Risk Score, Filer Status, and Monthly Surplus.
 */
export function buildInvestmentResponse(
  snap: CrossAppFinancialSnapshot,
  isKseQuery: boolean,
): CaSeg[] {
  const investableMonthly = Math.max(
    snap.monthlySurplus,
    Math.round(snap.monthlyIncome * 0.2),
  );
  const annualTax = computeAnnualSalariedTax(snap.annualIncome);
  const sec62Saving =
    snap.annualIncome > 0
      ? Math.round(
          (annualTax / snap.annualIncome) *
            Math.min(snap.annualIncome * 0.2, 2_000_000),
        )
      : 0;

  if (isKseQuery) {
    return [
      {
        t: `KSE-100 & Equity Strategy tailored to your profile (Risk Score: ${
          snap.riskScore
        }, Monthly Surplus: PKR ${fullAmt(
          snap.monthlySurplus,
        )}):\n\n• Recommended Monthly Equity SIP: `,
      },
      {
        t: `PKR ${fullAmt(Math.round(investableMonthly * 0.4))}`,
        tone: 'green',
      },
      {
        t: ` (40% of surplus) into high-dividend Shariah-compliant blue chips (Meezan Bank MEBL, Engro Fertilizers EFERT, Systems Ltd SYS, Lucky Cement LUCK).\n• Keep the remaining `,
      },
      {
        t: `PKR ${fullAmt(Math.round(investableMonthly * 0.6))}`,
        tone: 'green',
      },
      {
        t: ` in a low-risk Islamic Cash Fund as dry powder and emergency liquidity.\n• Tax Note: Dividend WHT is `,
      },
      {
        t:
          snap.filerStatus === 'non_filer'
            ? '30% (Non-Filer penalty!)'
            : '15% (Filer rate)',
        tone: snap.filerStatus === 'non_filer' ? 'red' : 'green',
      },
      { t: '.' },
    ];
  }

  return [
    {
      t: `Top SECP-Regulated Shariah-Compliant AMCs for your profile (Monthly Investable Surplus: PKR ${fullAmt(
        investableMonthly,
      )}):\n\n1. Al Meezan Investment Management (AM1 Rated):\n• Meezan Rozana Amdani / Islamic Cash Fund (Low Risk · ~17.5% annualized)\n• Meezan Islamic Fund (Equity · High Growth)\n\n2. UBL Fund Managers (Al-Ameen Islamic):\n• Al-Ameen Islamic Cash Fund (Low Risk · ~18.1% annualized)\n\n3. Tax Credit Advantage:\nInvesting PKR ${fullAmt(
        investableMonthly,
      )}/mo under Section 62 can save you up to `,
    },
    { t: `PKR ${fullAmt(sec62Saving)} / yr`, tone: 'green' },
    { t: ' in income tax.' },
  ];
}

// ============================================================================
// STEP 3: NATURAL LANGUAGE MEMORY FACT EXTRACTOR
// ============================================================================

const URDU_NUMBERS: Record<string, number> = { ek: 1, aik: 1, do: 2, teen: 3, chaar: 4, char: 4, paanch: 5, panch: 5 };
const WORD_NUMBERS: Record<string, number> = {
  no: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
};
const NOT_AN_EMPLOYER =
  /^(home|remote\w*|night\w*|a|an|the|my|it|this|that|freelanc\w*|myself|from\s+home|online)$/i;

function titleCase(text: string) {
  return text.replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Personal facts the user states about themselves ("My salary is 18 lakh a year", "I'm a filer",
 * "I have 2 kids", "I live in Karachi with my family"). Hypotheticals ("if my salary were…") and
 * questions about someone else are left alone.
 */
export function extractFactsFromMessage(
  message: string,
): { key: string; value: string }[] {
  const extracted: { key: string; value: string }[] = [];
  const text = normalizeLocal(message).trim();
  const hypothetical = /\b(if|suppose|supposing|what\s+if|agar|farz)\b/i.test(text);
  const has = (key: string) => extracted.some(f => f.key === key);
  const AMOUNT =
    '(\\d[\\d,]*(?:\\.\\d+)?(?:\\s*(?:lakh|lac|thousand|hazar|k|crore|cr)\\b)?)';

  // 1. Salary: "my salary is 2 lakh", "I earn 50 thousand", "my annual income is 24 lakh", "I get paid 120k a month"
  if (!hypothetical) {
    const salaryMatch = text.match(
      new RegExp(
        `(?:\\bmy\\s+(?:(?:monthly|annual|yearly|gross|net|take[-\\s]?home)\\s+)?(?:salary|income|pay)\\s*(?:is|=|:|of)?|\\bi\\s+(?:earn|make|get\\s+paid|take\\s+home)|\\bi(?:'m|\\s+am)\\s+(?:earning|paid))\\s+(?:about|around|roughly|approx\\.?|almost)?\\s*(?:pkr\\s*|rs\\.?\\s*|rupees\\s*)?${AMOUNT}`,
        'i',
      ),
    );
    if (salaryMatch) {
      const yearly =
        /\b(per\s+year|a\s+year|yearly|annual(?:ly)?|per\s+annum|p\.?a\.?)\b/i.test(
          text,
        );
      const parsed = parsePkrNumber(salaryMatch[1]);
      const fact = normalizeFact(
        yearly ? 'Annual Salary' : 'Salary',
        salaryMatch[1],
      );
      if (
        fact &&
        parsed &&
        parsed >= 5_000 &&
        !/\$|usd|dollars?|aed|riyal|euro|£|€/i.test(text)
      ) {
        extracted.push(fact);
      }
    }
  }

  // 2. Employer: "I work at Systems Limited", "my employer is Arbisoft" (not "I work from home")
  const empMatch = text.match(
    /(?:\bi\s+work\s+(?:at|for|in)|\bmy\s+(?:employer|company)\s+is)\s+([A-Za-z0-9 &.-]+?)(?=\s+(?:as|and|since|for|with|but)\b|[.,!?]|$)/i,
  );
  const employer = empMatch?.[1].trim();
  if (
    employer &&
    employer.length >= 2 &&
    employer.length <= 40 &&
    !NOT_AN_EMPLOYER.test(employer)
  ) {
    extracted.push({ key: 'Employer', value: employer });
  }

  // 3. Dependents: "I have 3 dependents", "2 kids", "two children", "dependents: 2"
  const depMatch =
    text.match(/\bdependents?\s*(?:is|are|:|=)\s*(\d+)/i) ??
    text.match(
      /\b(\d+|no|one|two|three|four|five|six|seven|eight)\s+(?:dependents?|kids?|children|child|sons?|daughters?)\b/i,
    );
  if (depMatch && !hypothetical && !/\?\s*$/.test(text)) {
    const raw = depMatch[1].toLowerCase();
    const count = /^\d+$/.test(raw) ? Number(raw) : WORD_NUMBERS[raw];
    if (count !== undefined && count <= 20)
      extracted.push({ key: 'Dependents', value: String(count) });
  }

  // 4. Risk: "my risk score is 7/10", "I'm a conservative investor", "I can take high risk"
  const riskMatch = text.match(
    /risk\s+(?:score|profile|tolerance|appetite)\s+(?:is\s+)?([A-Za-z0-9 /]+?)(?:\.|,|$)/i,
  );
  if (riskMatch && riskMatch[1].trim().length <= 25) {
    extracted.push({ key: 'Risk Score', value: riskMatch[1].trim() });
  } else if (!/\?\s*$/.test(text) && /\b(i|i'm|my)\b/i.test(text)) {
    const style = text.match(
      /\b(?:(low|moderate|medium|high)\s+risk|(conservative|cautious|aggressive|moderate)\s+investor)\b/i,
    );
    const word = (style?.[1] ?? style?.[2])?.toLowerCase();
    if (word) {
      const level = /low|conservative|cautious/.test(word)
        ? 'Low'
        : /high|aggressive/.test(word)
        ? 'High'
        : 'Moderate';
      extracted.push({ key: 'Risk Score', value: level });
    }
  }

  // 5. Filer status: "I'm a filer", "I am on the ATL", "I'm not a filer", "I'm a non-filer"
  if (
    /\bi(?:'m|\s+am)\s+(?:not\s+(?:an?\s+)?(?:fbr\s+)?(?:filer|on\s+(?:the\s+)?atl)|(?:an?\s+)?non[-\s]?filer)\b/i.test(
      text,
    )
  ) {
    extracted.push({ key: 'Tax Profile', value: 'Salaried · Non-Filer' });
  } else if (
    /\bi(?:'m|\s+am)\s+(?:an?\s+)?(?:active\s+)?(?:fbr\s+)?(?:filer|tax\s*filer|on\s+(?:the\s+)?atl)\b/i.test(
      text,
    )
  ) {
    extracted.push({ key: 'Tax Profile', value: 'Salaried · FBR Filer' });
  }

  // 6. City: "I live in Karachi with my family", "I'm from Lahore", "based in Islamabad"
  const cityMatch = text.match(
    /\b(?:i\s+live\s+in|i(?:'m|\s+am)\s+(?:from|based\s+in|living\s+in)|based\s+in)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2}?)(?=\s+(?:with|for|since|near|and|but|where|now|currently|city)\b|[.,!?]|$)/i,
  );
  const city = cityMatch?.[1].trim();
  if (city && city.length >= 3 && city.length <= 30 && !hypothetical) {
    extracted.push({ key: 'City', value: titleCase(city.toLowerCase()) });
  }

  // ── Roman Urdu ──
  // Salary: "meri tankhwah 1.5 lakh hai", "meri salary 2 lakh hai", "main 80 hazar kamata hoon"
  if (!hypothetical && !has('Salary')) {
    const ru =
      text.match(
        new RegExp(
          `\\b(?:meri|mera|apni)\\s+(?:(?:mahana|monthly|saalana|salana|yearly)\\s+)?(?:tankhwah|tankhwa|tankha|salary|income|aamdani|amdani|pay)\\s+(?:hai\\s+)?(?:taqreeban\\s+|lagbhag\\s+)?(?:pkr\\s*|rs\\.?\\s*)?${AMOUNT}`,
          'i',
        ),
      ) ??
      text.match(
        new RegExp(
          `\\b(?:main|mein|me)\\s+(?:(?:mahana|saalana|salana)\\s+)?(?:taqreeban\\s+|lagbhag\\s+)?(?:pkr\\s*|rs\\.?\\s*)?${AMOUNT}\\s*(?:rupay\\s+|rupaye\\s+)?(?:kamata|kamati|kamate|kama\\s+leta|kama\\s+leti)\\b`,
          'i',
        ),
      );
    if (ru) {
      const yearly = /\b(saalana|salana|saal\s+ki|saal\s+ka|yearly|annual|per\s+year|a\s+year)\b/i.test(text);
      const parsed = parsePkrNumber(ru[1]);
      const fact = normalizeFact(yearly ? 'Annual Salary' : 'Salary', ru[1]);
      if (fact && parsed && parsed >= 5_000) extracted.push(fact);
    }
  }

  // Filer: "main filer hoon", "main non filer hoon", "main filer nahi hoon"
  if (!has('Tax Profile')) {
    if (/\b(?:main|mein|me)\s+(?:(?:fbr\s+)?non[-\s]?filer\s+(?:hoon|hun|hu|hon)|(?:fbr\s+)?filer\s+nahi?n?\s+(?:hoon|hun|hu|hon))\b/i.test(text)) {
      extracted.push({ key: 'Tax Profile', value: 'Salaried · Non-Filer' });
    } else if (/\b(?:main|mein|me)\s+(?:active\s+)?(?:fbr\s+)?(?:filer|tax\s*filer)\s+(?:hoon|hun|hu|hon)\b/i.test(text)) {
      extracted.push({ key: 'Tax Profile', value: 'Salaried · FBR Filer' });
    }
  }

  // City: "main Karachi mein rehta hoon", "main Lahore se hoon"
  if (!has('City') && !hypothetical) {
    const ruCity =
      text.match(/\b(?:main|mein|me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:mein|me|main)\s+(?:rehta|rehti|rehte|rahta|rahti|rehtay)\b/i) ??
      text.match(/\b(?:main|mein|me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+se\s+(?:hoon|hun|hu|hon)\b/i);
    const city = ruCity?.[1].trim();
    if (city && city.length >= 3 && city.length <= 30 && !/^(filer|non|ghar|office|yahan|wahan)$/i.test(city)) {
      extracted.push({ key: 'City', value: titleCase(city.toLowerCase()) });
    }
  }

  // Dependents: "mere 2 bachay hain", "do bachay", "teen bachon ka baap"
  if (!has('Dependents') && !hypothetical && !/\?\s*$/.test(text)) {
    const kids = text.match(
      /\b(\d+|ek|aik|do|teen|chaar|char|paanch|panch)\s+(?:bachay|bachey|bache|bachon|bacche|bachche|bachiyan|bachi|betay|bete|beta|betiyan|beti)\b/i,
    );
    const n = kids ? (/^\d+$/.test(kids[1]) ? Number(kids[1]) : URDU_NUMBERS[kids[1].toLowerCase()]) : undefined;
    if (n !== undefined && n <= 20) extracted.push({ key: 'Dependents', value: String(n) });
  }

  // Employer: "main Systems Limited mein kaam karta hoon"
  if (!has('Employer')) {
    const job = text.match(/\b(?:main|mein|me)\s+([A-Za-z0-9 &.-]{2,40}?)\s+(?:mein|me|main|par|pe)\s+(?:kaam|job|naukri)\s+(?:karta|karti|karte)\b/i);
    const employer = job?.[1].trim();
    if (employer && !NOT_AN_EMPLOYER.test(employer) && !/^(ghar|ek|aik)$/i.test(employer)) {
      extracted.push({ key: 'Employer', value: employer });
    }
  }

  // Risk: "kam risk", "zyada risk le sakta hoon"
  if (!has('Risk Score') && !/\?\s*$/.test(text) && /\b(main|mein|mera|meri|mujhe)\b/i.test(text)) {
    const level = text.match(/\b(kam|thora|zyada|ziada|zyaada|darmiyana|medium)\s+risk\b/i)?.[1].toLowerCase();
    if (level) {
      extracted.push({
        key: 'Risk Score',
        value: /kam|thora/.test(level) ? 'Low' : /z[iy]a+da/.test(level) ? 'High' : 'Moderate',
      });
    }
  }

  return extracted;
}

/**
 * Extracts the most likely PKR monetary amount from natural language text.
 * Prioritizes explicit currency prefixes (PKR, Rs) and unit suffixes (lakh, lac, crore, k),
 * and falls back to the largest number in the sentence so model numbers (e.g. "iPhone 16",
 * "Honda 125", "PS5") or item quantities ("2 burgers") are never mistaken for the PKR amount.
 */
export function extractBestPkrAmount(text: string): number | null {
  // 1. Look for numbers with explicit currency prefix (PKR / Rs) or unit suffix (lakh / lac / crore / k)
  const explicitMatches = Array.from(
    text.matchAll(
      /(?:(?:pkr|rs\.?|rupees?)\s*(\d[\d,]*(?:\.\d+)?(?:\s*(?:lakh|lac|crore|cr|thousand|k))?)|(\d[\d,]*(?:\.\d+)?\s*(?:lakh|lac|crore|cr|thousand|k))\b)/gi,
    ),
  );
  if (explicitMatches.length > 0) {
    const parsedExplicit = explicitMatches
      .map(m => parsePkrNumber(m[1] || m[2]))
      .filter((n): n is number => n !== null && n > 0);
    if (parsedExplicit.length > 0) {
      return Math.max(...parsedExplicit);
    }
  }

  // 2. Look for numbers preceded by value prepositions (of, worth, target, amount, limit)
  const prepMatches = Array.from(
    text.matchAll(
      /\b(?:of|worth|target|amount|limit)\s+(?:pkr\s*|rs\.?\s*)?(\d[\d,]*(?:\.\d+)?(?:\s*(?:lakh|lac|crore|cr|k))?)/gi,
    ),
  );
  if (prepMatches.length > 0) {
    const parsedPrep = prepMatches
      .map(m => parsePkrNumber(m[1]))
      .filter((n): n is number => n !== null && n > 0);
    if (parsedPrep.length > 0) {
      return Math.max(...parsedPrep);
    }
  }

  // 3. Fallback: collect all numbers in the text and return the largest one
  const allMatches = Array.from(
    text.matchAll(/\d[\d,]*(?:\.\d+)?(?:\s*(?:lakh|lac|crore|cr|k))?\b/gi),
  );
  const parsedAll = allMatches
    .map(m => parsePkrNumber(m[0]))
    .filter((n): n is number => n !== null && n > 0);

  if (parsedAll.length > 0) {
    return Math.max(...parsedAll);
  }

  return null;
}

/**
 * STEP 3B: What the CA says when it found something to add. Nothing is saved yet: the screen shows
 * the action as a card and saves it only after the user taps Confirm.
 */
export function buildActionProposalResponse(
  actions: CaExecutableAction[],
  lang: CaLanguage = 'en',
): CaSeg[] {
  // Urdu-script messages get Roman Urdu here; the card's buttons stay in English.
  const urdu = lang !== 'en';
  if (actions.length > 1) {
    return [
      {
        t: urdu
          ? `Aap ke message mein ${actions.length} transactions mili hain. Neeche check karein aur Confirm dabayein.`
          : `I found ${actions.length} transactions in your message. Check them below and tap Confirm to add them.`,
      },
    ];
  }
  const a = actions[0];
  if (a.kind === 'add_goal' && !(a.amount > 0)) {
    return [
      {
        t: urdu
          ? `Main "${a.goalName}" ka goal bana deta hoon${a.deadline ? ' (deadline neeche hai)' : ''}. Is ke liye kitne paise jama karne hain? Neeche "Add target" dabayein, amount likhein, phir Confirm karein.`
          : `I'll create the goal "${a.goalName}"${a.deadline ? ' with the deadline below' : ''}. How much do you want to save for it? Tap "Add target" below to enter the amount, then Confirm.`,
      },
    ];
  }
  if (urdu) {
    const what =
      a.kind === 'set_budget'
        ? 'aap ka mahana budget set kar deta hoon'
        : a.kind === 'add_goal'
        ? `"${a.goalName}" ka goal bana deta hoon`
        : a.kind === 'add_contribution'
        ? `${a.goalName ? `"${a.goalName}"` : 'aap ke'} goal mein paise daal deta hoon`
        : `yeh ${a.txType === 'income' ? 'aamdani' : 'kharcha'} add kar deta hoon`;
    return [{ t: `Main ${what}. Neeche details check karein aur Confirm dabayein.` }];
  }
  const what =
    a.kind === 'set_budget'
      ? 'set your monthly budget'
      : a.kind === 'add_goal'
      ? `create the goal "${a.goalName}"`
      : a.kind === 'add_contribution'
      ? `put money towards ${a.goalName ? `"${a.goalName}"` : 'a goal'}`
      : `add this ${a.txType === 'income' ? 'income' : 'expense'}`;
  return [{ t: `I'll ${what}. Check the details below and tap Confirm.` }];
}

const YEARLY =
  /\b(per\s+year|a\s+year|yearly|annual(?:ly)?|per\s+annum|p\.?a\.?|ctc)\b|\/\s*(?:yr|year)\b/;
const BONUS = /\b(bonus|bonuses|incentive|arrears)\b/;

/** Tax on a one-off bonus: the extra tax it causes on top of the year's salary. */
export function buildBonusTaxResponse(
  snap: CrossAppFinancialSnapshot,
  bonus: number,
): CaSeg[] {
  const annual = snap.monthlyIncome * 12;
  const before = Math.round(computeAnnualSalariedTax(annual));
  const after = Math.round(computeAnnualSalariedTax(annual + bonus));
  const extra = after - before;
  const salaryNote =
    annual > 0
      ? `your yearly salary of PKR ${fullAmt(annual)}`
      : 'a salary of PKR 0 (add your salary in Memory for an exact figure)';
  return [
    {
      t: `A bonus is added to ${salaryNote} and taxed at your slab rate.\n\nTax on the year without the bonus: PKR ${fullAmt(
        before,
      )}\nTax with the PKR ${fullAmt(bonus)} bonus: PKR ${fullAmt(
        after,
      )}\n\nTax on the bonus: `,
    },
    { t: `PKR ${fullAmt(extra)}`, tone: 'red' },
    { t: `\nYou keep about ` },
    { t: `PKR ${fullAmt(bonus - extra)}`, tone: 'green' },
    {
      t: ` (${
        bonus > 0 ? ((extra / bonus) * 100).toFixed(1) : '0'
      }% of it goes to tax). Your employer usually deducts this in the month the bonus is paid.`,
    },
  ];
}

const SPEND_SYNONYMS: [RegExp, string][] = [
  [
    /\b(dining|food|eating\s+out|restaurants?|lunch|dinner|takeaway|khana|khane|khaane)\b/,
    'Dining',
  ],
  [/\b(groceries|grocery|rashan|ration|sabzi|kiryana)\b/, 'Groceries'],
  [/\b(fuel|petrol|transport|travel|uber|careem|safar)\b/, 'Fuel'],
  [/\b(bills?|utilities|electricity|gas|internet|rent|bijli|kiraya)\b/, 'Bills'],
];

/**
 * For "how much did I spend (on X)?" style questions: the category asked about, or null for all
 * spending. Undefined when the question isn't a spending lookup (e.g. "how can I spend less?").
 */
export function spendingQuestionCategory(
  q: string,
  snap: CrossAppFinancialSnapshot,
): string | null | undefined {
  const asksSpend =
    /\b(spen[dt]|spending|expenses?|kharch\w*)\b/.test(q) &&
    /\b(how\s+much|what(?:'s|\s+is|\s+are|\s+was|\s+were)?|show|total|kitna|kitni|kitne|batao|bataen)\b/.test(
      q,
    );
  if (
    !asksSpend ||
    /\b(save|saving|cut|reduce|less|lower|afford|plan|optimi[sz]e|tax|bachat|bachana|kam)\b/.test(
      q,
    )
  )
    return undefined;
  const own = snap.categories.find(c =>
    new RegExp(
      `\\b${c.category
        .toLowerCase()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    ).test(q),
  );
  if (own) return own.category;
  return SPEND_SYNONYMS.find(([re]) => re.test(q))?.[1] ?? null;
}

/** "What is my income?": the monthly figure the CA works with, and what is left after spending. */
export function buildIncomeResponse(snap: CrossAppFinancialSnapshot): CaSeg[] {
  if (snap.monthlyIncome <= 0) {
    return [
      {
        t: `I don't know your income yet. Add it under Memory → Salary, or tell me e.g. "My salary is PKR 1,50,000", and I'll use it for your tax and savings answers.`,
      },
    ];
  }
  const fromMemory = parsePkrNumber(snap.customFacts.Salary) !== null;
  return [
    { t: `Your monthly income is ` },
    { t: `PKR ${fullAmt(snap.monthlyIncome)}`, tone: 'green' },
    {
      t: ` (PKR ${fullAmt(snap.annualIncome)} a year), ${fromMemory ? 'from your Memory Bank' : 'from the income recorded in the app'}.\n\nThis month you've spent PKR ${fullAmt(snap.thisMonthSpent)}, leaving about PKR ${fullAmt(Math.max(0, snap.monthlyIncome - snap.thisMonthSpent))}.`,
    },
  ];
}

/** This month's spending, overall or in one category, with the budget where there is one. */
export function buildSpendingResponse(
  snap: CrossAppFinancialSnapshot,
  category: string | null,
): CaSeg[] {
  if (category) {
    const c = snap.categories.find(
      x => x.category.toLowerCase() === category.toLowerCase(),
    );
    if (!c || c.amount <= 0) {
      return [{ t: `You haven't spent anything on ${category} this month.` }];
    }
    const share =
      snap.thisMonthSpent > 0
        ? Math.round((c.amount / snap.thisMonthSpent) * 100)
        : 0;
    const segs: CaSeg[] = [
      { t: `This month you've spent ` },
      { t: `PKR ${fullAmt(c.amount)}`, tone: 'red' },
      { t: ` on ${c.category} (${share}% of all your spending).` },
    ];
    if (c.limit) {
      const left = c.limit - c.amount;
      segs.push(
        { t: `\nIts budget is PKR ${fullAmt(c.limit)}: ` },
        left >= 0
          ? { t: `PKR ${fullAmt(left)} left`, tone: 'green' }
          : { t: `PKR ${fullAmt(-left)} over`, tone: 'red' },
        { t: '.' },
      );
    }
    return segs;
  }
  const top = snap.categories
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  return [
    { t: `This month you've spent ` },
    { t: `PKR ${fullAmt(snap.thisMonthSpent)}`, tone: 'red' },
    {
      t:
        (snap.budgetLimit
          ? ` of your PKR ${fullAmt(snap.budgetLimit)} budget`
          : '') +
        (top.length > 0
          ? `.\n\nBiggest categories:\n${top
              .map(c => `• ${c.category}: PKR ${fullAmt(c.amount)}`)
              .join('\n')}`
          : '.') +
        (snap.avgMonthlySpend > 0
          ? `\n\nYour usual month: about PKR ${fullAmt(snap.avgMonthlySpend)}.`
          : ''),
    },
  ];
}

// ============================================================================
// STEP 4: QUERY ROUTER & LOCAL SYNTHESIZER
// ============================================================================

export function analyzeAndAnswerLocally(
  query: string,
  snap: CrossAppFinancialSnapshot,
): CaSeg[] {
  const lang = detectLanguage(query);
  query = normalizeLocal(query);
  const q = query.toLowerCase();

  // 0. A command (add transaction, create goal, set budget, add to a goal): propose it for confirmation.
  const actions = extractExecutableActions(
    query,
    snap.goals.map(g => g.name),
  );
  if (actions.length > 0) {
    return buildActionProposalResponse(actions, lang);
  }

  // Check if user mentioned a specific goal by name
  const matchedGoal = snap.goals.find(g => q.includes(g.name.toLowerCase()));

  // Extract any explicit target amount in the question (e.g. "how can I save 50000" or "tax on 200,000 salary")
  const explicitAmount = extractBestPkrAmount(query);

  // 1. Tax / FBR / WHT / Section 62 queries. A bonus is taxed on top of the salary; a yearly
  // figure is divided by 12 (the slabs work on the annual total).
  if (/(tax|fbr|wht|slab|filer|sec(?:tion)?\s*62|withholding)/.test(q)) {
    if (explicitAmount && BONUS.test(q)) {
      return buildBonusTaxResponse(snap, explicitAmount);
    }
    const monthly =
      explicitAmount && YEARLY.test(q) ? explicitAmount / 12 : explicitAmount;
    const customSalary =
      monthly && monthly >= 15_000 ? Math.round(monthly) : undefined;
    return buildTaxEstimateResponse(snap, customSalary);
  }

  // 2. Zakat / Nisab queries
  if (/(zakat|nisab|charity|sadqah|2\.5%)/.test(q)) {
    return buildZakatResponse(snap);
  }

  // 3. KSE-100 / PSX / Stocks queries
  // ("share" or "market" alone don't count: "share my budget", "supermarket".)
  if (
    /\b(kse|psx|stocks?|equit(?:y|ies)|blue[-\s]?chips?|(?:stock|share)\s*market|shares?\s+(?:of|in)\b)/.test(
      q,
    )
  ) {
    return buildInvestmentResponse(snap, true);
  }

  // 4. Mutual Funds / AMC / Shariah Investment queries
  if (
    /(amc|mutual\s+fund|shariah|meezan|invest|halal|return|secp)/.test(q) &&
    !/(save|saving|goal)/.test(q)
  ) {
    return buildInvestmentResponse(snap, false);
  }

  // 5. "How much did I spend on dining?": the figure itself, not a savings plan.
  if (
    /\b(what(?:'s|\s+is|\s+was)?|how\s+much|show|tell\s+me|kitna|kitni|kitne|batao|bataen|kya)\b/.test(q) &&
    /\b(income|salary|earnings?|earn|tankhwah|tankhwa|tankha|aamdani|amdani)\b/.test(q) &&
    !/\b(save|saving|increase|raise|grow)\b/.test(q)
  ) {
    return buildIncomeResponse(snap);
  }

  const spendCategory = spendingQuestionCategory(q, snap);
  if (spendCategory !== undefined) {
    return buildSpendingResponse(snap, spendCategory);
  }

  // 6. Savings / Goal / Budget / Optimize queries
  if (
    /(save|saving|goal|optimiz|budget|spend|expense|cut|afford|buy|laptop|house|car|target|month)/.test(
      q,
    ) ||
    matchedGoal ||
    explicitAmount
  ) {
    return buildSavingsPlanResponse(snap, explicitAmount, matchedGoal);
  }

  // 7. Comprehensive Financial Health & Memory Bank Overview (default for general questions)
  const topCat = snap.categories[0];
  const primaryGoal = snap.goals[0];

  return [
    {
      t: `Here is your live Financial Audit from the Memory Bank, ${
        snap.userName
      }:\n\n• Monthly Income: PKR ${fullAmt(
        snap.monthlyIncome,
      )}\n• Monthly Spend: `,
    },
    {
      t: `PKR ${fullAmt(snap.thisMonthSpent)}`,
      tone:
        snap.thisMonthSpent > snap.monthlyIncome && snap.monthlyIncome > 0
          ? 'red'
          : undefined,
    },
    {
      t: `${
        topCat
          ? ` (Top category: ${topCat.category} at PKR ${fullAmt(
              topCat.amount,
            )})`
          : ''
      }\n• Net Monthly Surplus: `,
    },
    { t: `PKR ${fullAmt(snap.monthlySurplus)}`, tone: 'green' },
    {
      t: ` (${
        snap.savingsRatePct
      }% savings rate)\n• Liquid Bank Balance: PKR ${fullAmt(
        snap.totalLiquidCash,
      )} across ${snap.bankAccounts.length} account${
        snap.bankAccounts.length === 1 ? '' : 's'
      }\n• Active Goals: ${
        primaryGoal
          ? `${primaryGoal.name} — PKR ${fullAmt(
              primaryGoal.remaining,
            )} left to save (~PKR ${fullAmt(primaryGoal.requiredPerMonth)}/mo)`
          : 'None set yet'
      }\n\nAsk me "How can I save PKR 50,000?", "Generate full tax estimate", or "Optimize savings rate" for a step-by-step calculation.`,
    },
  ];
}

// ============================================================================
// STEP 5: SERIALIZE LIVE MEMORY + CALCULATIONS FOR THE BACKEND AI MODEL
// ============================================================================

export function serializeMemoryForLlm(snap: CrossAppFinancialSnapshot): string {
  const catSummary =
    snap.categories.length > 0
      ? snap.categories
          .map(
            c =>
              `${c.category}: PKR ${fullAmt(c.amount)}${
                c.limit ? ` (Budget Cap: PKR ${fullAmt(c.limit)})` : ''
              } [Suggested Cut: PKR ${fullAmt(c.suggestedCut)}]`,
          )
          .join('; ')
      : 'No expenses logged this month';

  const goalSummary =
    snap.goals.length > 0
      ? snap.goals
          .map(
            g =>
              `${g.name}: Saved PKR ${fullAmt(g.saved)} of PKR ${fullAmt(
                g.target,
              )} (Remaining: PKR ${fullAmt(
                g.remaining,
              )}, Required/mo: PKR ${fullAmt(g.requiredPerMonth)})`,
          )
          .join('; ')
      : 'No savings goals added';

  const accountSummary =
    snap.bankAccounts.length > 0
      ? snap.bankAccounts
          .map(a => `${a.name}: PKR ${fullAmt(a.balance)}`)
          .join('; ')
      : 'No linked bank accounts';

  const customSummary = Object.entries(snap.customFacts)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');

  const annualTax = Math.round(computeAnnualSalariedTax(snap.annualIncome));
  const monthlyTax = Math.round(annualTax / 12);

  return [
    `USER_NAME: ${snap.userName}`,
    `MONTHLY_INCOME_PKR: ${snap.monthlyIncome} (Annual: PKR ${snap.annualIncome})`,
    `FBR_TAX_PROFILE: ${snap.filerStatus} (Calculated Annual Tax: PKR ${annualTax}, Monthly WHT: PKR ${monthlyTax}, Sec 62 Already Used: PKR ${snap.sec62Used})`,
    `THIS_MONTH_SPENT_PKR: ${snap.thisMonthSpent} (3-Month Avg: PKR ${snap.avgMonthlySpend})`,
    `MONTHLY_BUDGET_LIMIT_PKR: ${snap.budgetLimit ?? 'Not set'}`,
    `RECURRING_BILLS_PKR: ${snap.recurringBillsTotal}/mo | LOAN_EMI_PKR: ${snap.monthlyLoanEmi}/mo (Total Debt Remaining: PKR ${snap.totalDebtRemaining})`,
    `NET_MONTHLY_SURPLUS_PKR: ${snap.monthlySurplus} (Savings Rate: ${snap.savingsRatePct}%)`,
    `OPTIMIZED_MONTHLY_SAVINGS_CAPACITY_PKR: ${snap.optimizedMonthlySavings} (if discretionary spend cut by PKR ${snap.potentialMonthlyCut}/mo)`,
    `LIQUID_BANK_CASH_PKR: ${snap.totalLiquidCash} (${accountSummary})`,
    `INVESTED_HOLDINGS_PKR: ${snap.totalInvested} | NET_WORTH_PKR: ${snap.netWorth}`,
    `CATEGORY_SPENDING_BREAKDOWN: ${catSummary}`,
    `SAVINGS_GOALS: ${goalSummary}`,
    `CITY: ${snap.city} | EMPLOYER: ${snap.employer} | DEPENDENTS: ${snap.dependents} | RISK_SCORE: ${snap.riskScore}`,
    customSummary ? `CUSTOM_MEMORY_BANK_FACTS: ${customSummary}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
