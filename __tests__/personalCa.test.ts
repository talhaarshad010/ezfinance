/**
 * Personal CA: commands found in chat messages, facts the user states about themselves, and which
 * kind of answer a question gets. Each case here is a bug that was found by hand.
 */
jest.mock('react-native-device-info', () => ({ isEmulatorSync: () => false }));
jest.mock('react-native-keychain', () => ({}));
jest.mock('@react-native-google-signin/google-signin', () => ({ GoogleSignin: {} }));

import {
  extractExecutableActions,
  normalizeFact,
  pickAmount,
  sanitizeAiAction,
} from '../src/features/main/screens/ca/caActions';
import { detectLanguage } from '../src/features/main/screens/ca/caLanguage';
import {
  analyzeAndAnswerLocally,
  computeAnnualSalariedTax,
  extractFactsFromMessage,
  type CrossAppFinancialSnapshot,
} from '../src/features/main/screens/ca/caEngine';

// Saturday 18 October 2026, mid-afternoon.
const TODAY = new Date(2026, 9, 18, 15);
const GOALS = ['New Laptop'];
const actions = (text: string, goals = GOALS) => extractExecutableActions(text, goals, TODAY);

describe('commands become proposals with the right details', () => {
  test.each([
    "Don't add 500 for lunch",
    'How much did I spend on dining?',
    'Can I afford a 50k phone?',
    'Add $300 for hosting',
  ])('nothing is proposed for "%s"', text => {
    expect(actions(text)).toEqual([]);
  });

  test('money for a goal is a contribution, not an expense', () => {
    expect(actions('Add 5k to my savings')).toEqual([
      { kind: 'add_contribution', amount: 5000, goalName: 'New Laptop', date: '2026-10-18' },
    ]);
    expect(actions('add 10000 to my New Laptop goal')[0]).toMatchObject({ kind: 'add_contribution', amount: 10000 });
  });

  test('model numbers, quantities and durations are not the amount', () => {
    expect(actions('Spent 15 on iPhone 16 case')[0]).toMatchObject({ amount: 15, note: 'iPhone' });
    expect(actions('Bought 2 shirts for 3000')[0]).toMatchObject({ amount: 3000 });
    expect(pickAmount('save for 6 months')).toBeNull();
  });

  test('account, category and Pakistani number formats', () => {
    expect(actions('Log 1500 petrol from Meezan')[0]).toMatchObject({ amount: 1500, category: 'Fuel', accountHint: 'Meezan' });
    expect(actions('Add 1,50,000 salary')[0]).toMatchObject({ txType: 'income', amount: 150000, category: 'Salary' });
    expect(actions('Received 25 thousand from freelance client')[0]).toMatchObject({ txType: 'income', amount: 25000 });
  });

  test('dates, including a misspelt "yesterday"', () => {
    expect(actions('I spent 2000 on groceries yesterday')[0]).toMatchObject({ date: '2026-10-17', category: 'Groceries' });
    expect(actions('Paid 3500 electricity bill on 5 Oct')[0]).toMatchObject({ date: '2026-10-05', category: 'Bills' });
    const typo = actions('I have spend 999 yesterat')[0];
    expect(typo).toMatchObject({ amount: 999, date: '2026-10-17' });
    expect(typo.note).toBeUndefined();
  });

  test('several items in one message', () => {
    expect(actions('Spent 500 on lunch and 1200 on fuel')).toMatchObject([
      { amount: 500, category: 'Dining' },
      { amount: 1200, category: 'Fuel' },
    ]);
  });

  test('budget and goals', () => {
    expect(actions('Set my budget to 80k')).toEqual([{ kind: 'set_budget', amount: 80000 }]);
    expect(actions('Create a goal of 2 lakh for Umrah')[0]).toMatchObject({ kind: 'add_goal', amount: 200000, goalName: 'Umrah' });
  });

  test('a goal with a duration but no amount asks for the target', () => {
    expect(actions('Make a goal of bike with duration of 6 months.')).toEqual([
      { kind: 'add_goal', amount: 0, goalName: 'Bike', deadline: '2027-04-18' },
    ]);
    expect(actions('Create a new car goal of 5 lakh in 2 years')[0]).toMatchObject({
      amount: 500000,
      goalName: 'Car',
      deadline: '2028-10-18',
    });
    expect(actions('Make a goal for a laptop by December')[0]).toMatchObject({ goalName: 'Laptop', deadline: '2026-12-31' });
  });
});

describe('suggestions from the AI are checked', () => {
  test('bad category and future date are corrected; unknown kinds are dropped', () => {
    expect(
      sanitizeAiAction({ kind: 'add_transaction', amount: '1200', txType: 'expense', category: 'Weird', note: 'taxi', date: '2027-01-01' }, GOALS, TODAY),
    ).toMatchObject({ amount: 1200, category: 'Fuel', date: '2026-10-18' });
    expect(sanitizeAiAction({ kind: 'delete_all', amount: 5 }, GOALS, TODAY)).toBeNull();
    expect(sanitizeAiAction({ kind: 'add_transaction', amount: 0 }, GOALS, TODAY)).toBeNull();
    expect(sanitizeAiAction({ kind: 'add_goal', amount: 0, goalName: 'Bike' }, GOALS, TODAY)).toMatchObject({ amount: 0, goalName: 'Bike' });
  });

  test('salary facts are stored monthly under one key', () => {
    expect(normalizeFact('Monthly Salary', '1,50,000')).toEqual({ key: 'Salary', value: 'PKR 1,50,000 / mo' });
    expect(normalizeFact('Annual Salary', '18 lakh')).toEqual({ key: 'Salary', value: 'PKR 1,50,000 / mo' });
  });
});

describe('facts the user states about themselves', () => {
  const fact = (text: string, key: string) => extractFactsFromMessage(text).find(f => f.key === key)?.value;

  test('salary', () => {
    expect(fact('My salary is 18 lakh a year', 'Salary')).toBe('PKR 1,50,000 / mo');
    expect(fact('I earn 50 thousand', 'Salary')).toBe('PKR 50,000 / mo');
    expect(fact('If my salary is 3 lakh, how much tax?', 'Salary')).toBeUndefined();
  });

  test('employer, city, dependents, filer status and risk', () => {
    expect(fact('I work at Systems Limited', 'Employer')).toBe('Systems Limited');
    expect(fact('I work from home', 'Employer')).toBeUndefined();
    expect(fact('I live in Karachi with my family', 'City')).toBe('Karachi');
    expect(fact("I'm from lahore", 'City')).toBe('Lahore');
    expect(fact('I have 2 kids', 'Dependents')).toBe('2');
    expect(fact('married with two children', 'Dependents')).toBe('2');
    expect(fact("I'm a filer", 'Tax Profile')).toBe('Salaried · FBR Filer');
    expect(fact("I'm not a filer", 'Tax Profile')).toBe('Salaried · Non-Filer');
    expect(fact("I'm a conservative investor", 'Risk Score')).toBe('Low');
  });
});

describe('questions get the right kind of answer', () => {
  const snap = {
    userName: 'Ali',
    monthlyIncome: 150_000,
    annualIncome: 1_800_000,
    thisMonthSpent: 60_000,
    avgMonthlySpend: 55_000,
    recurringBillsTotal: 0,
    monthlyLoanEmi: 0,
    totalDebtRemaining: 0,
    totalLiquidCash: 100_000,
    totalInvested: 0,
    netWorth: 100_000,
    monthlySurplus: 90_000,
    savingsRatePct: 60,
    budgetLimit: 100_000,
    filerStatus: 'filer',
    city: 'Lahore',
    employer: 'Not added yet',
    riskScore: 'Moderate',
    dependents: '0',
    sec62Used: 0,
    categories: [
      { category: 'Dining', amount: 12_000, limit: 10_000, isDiscretionary: true, suggestedCut: 2_000 },
      { category: 'Groceries', amount: 30_000, limit: null, isDiscretionary: false, suggestedCut: 2_400 },
    ],
    potentialMonthlyCut: 4_400,
    optimizedMonthlySavings: 94_400,
    goals: [],
    bankAccounts: [{ name: 'HBL', balance: 100_000 }],
    customFacts: {},
    memoryRows: [],
  } as CrossAppFinancialSnapshot;
  const answer = (q: string) => analyzeAndAnswerLocally(q, snap).map(s => s.t).join('');

  test('a yearly amount is taxed as yearly, not monthly', () => {
    const tax = computeAnnualSalariedTax(1_800_000);
    expect(answer('How much tax on 18 lakh per year?')).toContain(`Annual income: PKR 18,00,000`);
    expect(tax).toBe(120_000);
  });

  test('a bonus is taxed on top of the salary', () => {
    const text = answer('How much tax will I pay on a 3 lakh bonus?');
    expect(text).toContain('Tax on the bonus');
    // 18,00,000 → 21,00,000: the extra 3,00,000 is in the 15% slab.
    expect(text).toContain('PKR 45,000');
  });

  test('"share" and "market" alone are not stock questions', () => {
    expect(answer('Should I share my budget with my wife?')).not.toContain('KSE-100');
    expect(answer('How is the KSE-100 doing?')).toContain('KSE-100');
  });

  test('Roman Urdu questions and commands', () => {
    expect(answer('kal 800 ka khana khaya')).toBe('Main yeh kharcha add kar deta hoon. Neeche details check karein aur Confirm dabayein.');
    expect(answer('mera khane ka kharcha kitna hai')).toContain("you've spent PKR 12,000 on Dining");
    expect(answer('meri income kitni hai')).toContain('Your monthly income is PKR 1,50,000');
  });

  test('spending and income questions get the figure', () => {
    expect(answer('How much is my dining spend?')).toContain("you've spent PKR 12,000 on Dining");
    expect(answer('What is my income?')).toContain('Your monthly income is PKR 1,50,000');
  });
});

describe('Roman Urdu (and Urdu script)', () => {
  test('the language is recognised', () => {
    expect(detectLanguage('mera kharcha kitna hai')).toBe('roman-ur');
    expect(detectLanguage('kal 800 ka khana khaya')).toBe('roman-ur');
    expect(detectLanguage('How much did I spend on dining?')).toBe('en');
    expect(detectLanguage('Spent 500 on lunch')).toBe('en');
    expect(detectLanguage('کل ۸۰۰ روپے کا کھانا کھایا')).toBe('ur');
  });

  test('expenses and income', () => {
    expect(actions('kal 800 ka khana khaya')).toEqual([
      { kind: 'add_transaction', txType: 'expense', amount: 800, category: 'Dining', note: 'Khana', date: '2026-10-17' },
    ]);
    expect(actions('petrol mein 3000 dalwaye')[0]).toMatchObject({ amount: 3000, category: 'Fuel', txType: 'expense' });
    expect(actions('bijli ka bill 3500 bhara')[0]).toMatchObject({ amount: 3500, category: 'Bills' });
    expect(actions('aaj tankhwah 1.5 lakh aayi')[0]).toMatchObject({ txType: 'income', amount: 150000, category: 'Salary' });
    expect(actions('freelance se 25 hazar mile')[0]).toMatchObject({ txType: 'income', amount: 25000 });
    expect(actions('500 ki chai aur 200 ke biscuit liye')).toMatchObject([{ amount: 500 }, { amount: 200 }]);
    expect(actions('Meezan se 1200 ka rashan liya')[0]).toMatchObject({ amount: 1200, category: 'Groceries', accountHint: 'Meezan' });
  });

  test('Urdu script', () => {
    expect(actions('کل ۸۰۰ روپے کا کھانا کھایا')[0]).toMatchObject({ amount: 800, category: 'Dining', date: '2026-10-17' });
  });

  test('questions and "don\'t" add nothing', () => {
    expect(actions('is mahine kitna kharcha hua?')).toEqual([]);
    expect(actions('kya main 50 hazar ka phone afford kar sakta hoon')).toEqual([]);
    expect(actions('500 lunch ka mat daalo')).toEqual([]);
    expect(actions('kya aap 500 lunch ke add kar sakte hain')[0]).toMatchObject({ amount: 500 });
  });

  test('budget, goals and contributions', () => {
    expect(actions('mera budget 80 hazar kar do')).toEqual([{ kind: 'set_budget', amount: 80000 }]);
    expect(actions('bike ke liye 1 lakh ka goal banao 6 mahine mein')[0]).toMatchObject({
      kind: 'add_goal',
      amount: 100000,
      goalName: 'Bike',
      deadline: '2027-04-18',
    });
    expect(actions('laptop goal mein 5000 daalo')[0]).toMatchObject({ kind: 'add_contribution', amount: 5000, goalName: 'New Laptop' });
  });

  test('facts', () => {
    const fact = (text: string, key: string) => extractFactsFromMessage(text).find(f => f.key === key)?.value;
    expect(fact('meri tankhwah 1.5 lakh hai', 'Salary')).toBe('PKR 1,50,000 / mo');
    expect(fact('main 80 hazar kamata hoon', 'Salary')).toBe('PKR 80,000 / mo');
    expect(fact('meri saalana tankhwah 18 lakh hai', 'Salary')).toBe('PKR 1,50,000 / mo');
    expect(fact('main filer hoon', 'Tax Profile')).toBe('Salaried · FBR Filer');
    expect(fact('main filer nahi hoon', 'Tax Profile')).toBe('Salaried · Non-Filer');
    expect(fact('main karachi mein rehta hoon', 'City')).toBe('Karachi');
    expect(fact('mere 2 bachay hain', 'Dependents')).toBe('2');
    expect(fact('hamare do bachay hain', 'Dependents')).toBe('2');
    expect(fact('main Systems Limited mein kaam karta hoon', 'Employer')).toBe('Systems Limited');
  });
});

test('multi-word bank names are recognised as the account', () => {
  expect(actions('Paid 2000 for groceries from Bank Alfalah')[0]).toMatchObject({ accountHint: 'Bank Alfalah' });
  expect(actions('bank alfalah se 900 ka petrol dalwaya')[0]).toMatchObject({ amount: 900, accountHint: 'bank alfalah' });
});
