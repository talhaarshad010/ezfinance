import { normalizeLocal } from './caLanguage';
/**
 * Personal CA — reading app commands from chat ("Add 500 for lunch", "I spent 2000 on groceries
 * yesterday", "Add 10000 to my laptop goal", "Set my budget to 80k").
 *
 * Nothing here changes data: it only proposes actions. The CA screen shows each proposal as a card
 * and saves it only after the user taps Confirm.
 */

export type ValidTxCategory = 'Groceries' | 'Fuel' | 'Salary' | 'Bills' | 'Dining' | 'Other';
export const TX_CATEGORIES: ValidTxCategory[] = ['Groceries', 'Fuel', 'Salary', 'Bills', 'Dining', 'Other'];

export type CaActionKind = 'add_transaction' | 'add_goal' | 'set_budget' | 'add_contribution';

export interface CaExecutableAction {
  kind: CaActionKind;
  txType?: 'expense' | 'income';
  amount: number;
  category?: ValidTxCategory;
  note?: string;
  /** Bank / wallet named in the message ("from Meezan"). */
  accountHint?: string;
  /** New goal's name (add_goal) or the goal to put money towards (add_contribution). */
  goalName?: string;
  /** New goal's target date, YYYY-MM-DD (add_goal), from "in 6 months" or "by December". */
  deadline?: string;
  /** YYYY-MM-DD; today when the message names no day. */
  date?: string;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const QUESTION = /^(how|what|why|when|where|which|who|should\s+i|is\s+it|am\s+i|calculate|generate|optimi[sz]e|explain|compare)\b/i;
const NEGATION = /\b(don'?t|do\s+not|dont|never|cancel|undo|mat\s+(?:karo|daalo|likho|add)|nahi|nahin|na\s+karo)\b/i;
const FOREIGN_CURRENCY = /\$|\busd\b|\bdollars?\b|\beuros?\b|€|£|\baed\b|\bdirhams?\b|\briyals?\b/i;
const TX_VERB = /\b(add|log|record|enter|insert|put|note|daal|daalo|likh|likho|darj)\b/i;
// Roman Urdu: "kharch kiye", "khaya", "liya", "kharida", "dalwaya" (petrol), "bhara" (bill), "diye".
const SPENT_VERB =
  /\b(spent|spend|paid|pay|bought|purchased|gave|kharch\w*|diye|diya|di|khaya|khaye|khayi|liya|liye|li|kharida|kharidi|kharide|dalwaya|dalwaye|dalwayi|bhara|bhari|bhare|piya|pi|lagaye|lagay|lage|laga|ada)\b/i;
const INCOME_WORD =
  /\b(income|salary|received|receive|earned|credited|credit|deposit(?:ed)?|got\s+paid|bonus|freelanc\w*|stipend|profit|tankhwah|tankhwa|tankha|aamdani|amdani|mile|mila|mili|milay|aaye|aaya|aayi|aye|aya|ayi|wasool)\b/i;
const TX_NOUN = /\b(transaction\w*|expense\w*|income|entry|ledger|bill|payment|kharcha)\b/i;
// Roman Urdu questions ("kitna kharcha hua?", "kya main afford kar sakta hoon?"), unless they also
// ask to add something ("kya aap 500 add kar sakte hain").
const ROMAN_QUESTION = /\b(kitna|kitni|kitne|kya|kaise|kese|kaisay|kyun|kyon|kab|kahan|batao|bataen|bataein|sakta|sakti|sakte)\b/i;
const ROMAN_ADD = /\b(add|daal\w*|likh\w*|darj)\b/i;

/** Parses a PKR number from text like "PKR 1,50,000 / mo", "2 lakh", "50 thousand", "15k" or "50000". */
export function parsePkrNumber(raw: string | undefined | null): number | null {
  if (!raw || raw === 'Not added yet') return null;
  const lower = raw.toLowerCase().replace(/,/g, '');
  const unit = (re: RegExp, mult: number) => {
    const m = lower.match(re);
    return m ? Math.round(parseFloat(m[1]) * mult) : null;
  };
  const value =
    unit(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)\b/, 100_000) ??
    unit(/(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/, 10_000_000) ??
    unit(/(\d+(?:\.\d+)?)\s*(?:thousand|hazar|hazaar)\b/, 1_000) ??
    unit(/(\d+(?:\.\d+)?)\s*k\b/, 1_000) ??
    unit(/(\d+(?:\.\d+)?)/, 1);
  return value !== null && value > 0 ? value : null;
}

/** Maps natural language keywords to EzFinance's transaction categories. */
export function inferTransactionCategory(text: string, txType: 'expense' | 'income'): ValidTxCategory {
  const lower = text.toLowerCase();
  if (txType === 'income') {
    return /\b(salary|paycheck|payroll|stipend|tankhwah|tankhwa|tankha|bonus)\b/.test(lower) ? 'Salary' : 'Other';
  }
  if (/\b(grocer\w*|mart|supermarket|imtiaz|carrefour|chase\s*up|al-?fatah|naheed|milk|vegetable\w*|fruit\w*|rashan|ration|bread|eggs|atta|aata|sabzi\w*|doodh|anday|ande|anda|chawal|cheeni|ghee|kiryana|kiryane|phal)\b/.test(lower)) {
    return 'Groceries';
  }
  if (/\b(fuel|petrol|diesel|cng|pso|shell|parco|attock|hascol|uber|indrive|careem|yango|bykea|ride|rickshaw|rikshaw|taxi|transport|patrol|kiraya\s+(?:bus|gari|gaari)|bus|motorway)\b/.test(lower)) {
    return 'Fuel';
  }
  if (/\b(bill\w*|electric\w*|k-?electric|lesco|iesco|mepco|fesco|gepco|pesco|wapda|ssgc|sngpl|gas\s*bill|ptcl|nayatel|storm\s*fiber|internet|wifi|water|utility|utilities|rent|maintenance|mobile\s*(?:load|package)|top-?up|zong|ufone|bijli|bijlee|pani|paani|kiraya|kiraaya|fees?|load)\b/.test(lower)) {
    return 'Bills';
  }
  if (/\b(dining|food|dinner|lunch|breakfast|brunch|coffee|cafe|restaurant|kfc|mcdonald\w*|pizza\w*|burger\w*|biryani|karahi|chai|tea|snack\w*|foodpanda|bakery|sweet\w*|ice\s*cream|khana|khane|nashta|nashtay|roti|dhaba|daawat|dawat|samosa\w*|paratha\w*|mithai)\b/.test(lower)) {
    return 'Dining';
  }
  return 'Other';
}

const pad = (n: number) => String(n).padStart(2, '0');
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The day a message talks about ("yesterday", "kal", "last Friday", "5 Oct", "5/10"), never in the future. */
/** Common misspellings: "yesterat", "yesterdy", "yestrday", "ystrday". */
const YESTERDAY_TYPO = /\b(?:yes?ter\w*|yestr\w*|ystr?d\w*)\b/;

export function parseDateMention(text: string, today = new Date()): Date | null {
  const lower = text.toLowerCase();
  const day = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
  if (/\b(day\s+before\s+yesterday|parson|parso)\b/.test(lower)) return day(2);
  if (/\b(yesterday|kal)\b/.test(lower) || YESTERDAY_TYPO.test(lower)) return day(1);
  if (/\b(today|aaj)\b/.test(lower)) return day(0);

  const weekday = lower.match(/\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (weekday) {
    const target = WEEKDAYS.indexOf(weekday[1]);
    const back = ((today.getDay() - target + 7) % 7) || 7;
    return day(back);
  }

  const inYear = (month: number, date: number) => {
    let d = new Date(today.getFullYear(), month, date);
    if (d.getMonth() !== month) return null; // e.g. 31 Feb
    if (d > today) d = new Date(today.getFullYear() - 1, month, date);
    return d;
  };
  const dayMonth = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  if (dayMonth) return inYear(MONTHS.indexOf(dayMonth[2]), Number(dayMonth[1]));
  const monthDay = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (monthDay) return inYear(MONTHS.indexOf(monthDay[1]), Number(monthDay[2]));
  const numeric = lower.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-]\d{2,4})?\b/); // day first (Pakistan)
  if (numeric && Number(numeric[2]) >= 1 && Number(numeric[2]) <= 12) return inYear(Number(numeric[2]) - 1, Number(numeric[1]));
  return null;
}

// Words that come right before the amount in a command ("add 500", "spent 2000", "of 1200").
const LEAD_WORDS = new Set([
  'add', 'log', 'record', 'enter', 'put', 'note', 'spent', 'spend', 'paid', 'pay', 'bought', 'gave', 'received', 'earned',
  'got', 'expense', 'income', 'salary', 'of', 'worth', 'is', 'to', 'set', 'budget', 'kharcha', 'contribute', 'deposit',
  'move', 'transfer', 'save', 'daal', 'daalo', 'rs', 'rs.', 'pkr', 'rupees', 'amount', 'target',
]);
const DURATION_WORD = /^(months?|mahine|mahina|years?|yrs?|saal|weeks?|hafte|hafta|days?|din)\b/i;
const QUANTITY_WORDS = /^(kg|kgs|g|gm|gram|grams|l|ltr|litre|litres|liter|liters|pcs|pieces|piece|items?|x|plates?|cups?|dozen|packs?|bottles?|people|persons|times|months?|days?|years?)\b/i;
const AMOUNT_TOKEN = /(?:(rs\.?|pkr|rupees?)\s*)?(\d[\d,]*(?:\.\d+)?)(\s*(?:lakh|lac|crore|cr|thousand|hazar|hazaar|k)\b)?/gi;

/**
 * The amount meant in a command, not a model number ("iPhone 16"), a quantity ("2 burgers") or a
 * date ("5 Oct"). Each number is scored by what surrounds it; the best one wins.
 */
export function pickAmount(text: string): number | null {
  let best: { value: number; score: number } | null = null;
  for (const m of text.matchAll(AMOUNT_TOKEN)) {
    const value = parsePkrNumber(m[2] + (m[3] ?? ''));
    if (value === null) continue;
    const start = m.index ?? 0;
    const before = text.slice(0, start);
    const after = text.slice(start + m[0].length);
    const prevRaw = before.trimEnd().split(/\s+/).pop() ?? '';
    const prevWord = prevRaw.toLowerCase().replace(/[^a-z.]/g, '');
    const nextWord = after.trimStart().split(/\s+/)[0] ?? '';
    // "6 months", "1 year", "6-month": a length of time, not money.
    if (DURATION_WORD.test(nextWord) || /^-\s*(?:months?|years?|weeks?|days?)\b/i.test(after)) continue;

    let score = 0;
    if (m[1] || m[3]) score += 3; // currency or unit: Rs 500, 5k, 2 lakh
    else if (/^(rs\.?|rupay|rupaye|rupee|rupees|ruppay|pkr)\b/i.test(nextWord)) score += 3; // 800 rupay
    if (LEAD_WORDS.has(prevWord)) score += 2;
    if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(nextWord) || /^(st|nd|rd|th)\b/i.test(nextWord)) score -= 4;
    if (/^[/-]\d/.test(after) || /\d[/-]$/.test(before)) score -= 4; // part of 5/10 or 05-10-2026
    if (/[A-Za-z]-$/.test(before)) score -= 4; // KSE-100
    if (QUANTITY_WORDS.test(nextWord)) score -= 3;
    else if (/^[a-z]{3,}s$/i.test(nextWord) && !/^(rs|rupees|bills)$/i.test(nextWord)) score -= 2; // "2 burgers"
    // A model / product number: right after a product-like word (iPhone 16, Honda 125, PS 5).
    if (prevRaw && !LEAD_WORDS.has(prevWord) && /^(?:[a-z]+[A-Z]\w*|[A-Z][a-z]+|[A-Z]{2,})$/.test(prevRaw)) score -= 3;
    score += Math.log10(value) / 100; // tie-break: the larger number
    if (!best || score > best.score) best = { value, score };
  }
  return best?.value ?? null;
}

const BANKS = String.raw`meezan|hbl|habib|alfalah|bank\s+alfalah|ubl|mcb|allied|abl|faysal|standard\s*chartered|scb|askari|bank\s*islami|js\s*bank|nayapay|sadapay|easypaisa|jazzcash|raqami`;
// "from Meezan", "via HBL" — and Roman Urdu, where the bank comes first: "Meezan se", "HBL account se".
const ACCOUNT_HINT = new RegExp(`\\b(?:from|in|via|using|through|account|se)\\s+(${BANKS})\\b|\\b(${BANKS})\\s+(?:account\\s+|wallet\\s+)?se\\b`, 'i');

function accountHintOf(text: string) {
  const m = text.match(ACCOUNT_HINT);
  return (m?.[1] ?? m?.[2])?.trim();
}

const NOTE_STOP = /\s+(?:from|via|using|through|in|on|at|with|yesterday|today|kal|aaj|last|se|pkr\b|rs\.?|\d|yes?ter\w*|yestr\w*)/i;
const FILLER = /\b(i've|ive|i'm|im|i|my|mile|mila|mili|milay|aaye|aaya|aayi|wasool|hain|thi|the|mein|me|ne|maine|mene|kiya|kiye|kardo|khaya|khaye|khayi|liya|liye|li|piya|pi|kharida|kharidi|kharide|dalwaya|dalwaye|bhara|bhare|parson|rupay|rupaye|rupee|hazaar|wala|wali|pe|par|per|se|aur|bhi|darj|plz|yaar|bhai|mera|meri|mere|apna|apni|ho|hua|hue|gaya|gaye|gayi|lagaye|ada|me|a|an|the|please|pls|for|on|of|to|is|was|have|has|had|just|already|been|today's|yes?ter\w*|yestr\w*|add|log|record|enter|put|note|spent|spend|paid|pay|bought|purchased|gave|received|earned|got|expense|expenses|transaction|income|entry|karo|kar|ka|ki|ke|ko|hai|tha|daal|daalo|likh|likho|kharch|kharcha|diye|diya|rs|pkr|rupees|yesterday|today|kal|aaj|lakh|lac|thousand|k)\b/gi;

/** A short note for the transaction: "for lunch" → "Lunch", "1500 petrol from Meezan" → "Petrol". */
function noteOf(part: string): string | undefined {
  const explicit = part.match(/(?:with\s+note|note\s*:|description\s*:|titled)\s+["']?([^"',.]+)["']?/i);
  let note = explicit?.[1];
  if (!note) {
    const forOn = part.match(/\b(?:for|on)\s+(?!(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\d)([A-Za-z][A-Za-z0-9 &'+-]*)/i);
    note = forOn ? forOn[1].split(NOTE_STOP)[0] : undefined;
  }
  if (!note) {
    note = part
      .replace(ACCOUNT_HINT, ' ')
      .replace(/\b(?:last\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, ' ')
      .replace(/[\d,.:/-]+/g, ' ')
      .replace(FILLER, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  note = note?.replace(/\s+/g, ' ').trim();
  if (!note || note.split(' ').length > 6 || /^(expense\w*|transaction\w*|income|me|it|this|that)$/i.test(note)) return undefined;
  // Brand-style words keep their case ("iPhone", "eBay").
  if (/^[a-z]+[A-Z]/.test(note)) return note.slice(0, 40);
  return (note.charAt(0).toUpperCase() + note.slice(1)).slice(0, 40);
}

/** "Add 300 for chai and 200 for biscuits" → two items. Only splits where each piece has its own amount. */
function splitItems(text: string): string[] {
  const parts = text.split(/\s*(?:,|\band\b|\baur\b|&|\+)\s*(?=(?:rs\.?\s*|pkr\s*)?\d)/i).map(p => p.trim()).filter(Boolean);
  return parts.length > 1 && parts.every(p => pickAmount(p) !== null) ? parts : [text];
}

const CREATE_GOAL =
  /\b(?:create|make|start|set\s*up|setup)\b[^.?!]{0,40}\bgoal\b|\b(?:add|set)\s+(?:a|an|new)\s+(?:[a-z]+\s+){0,2}goal\b|\bgoal\b[^.?!]{0,40}\b(?:banao|banaen|banayen|banaein|bana\s*do|banado|bana\s+dein|set\s+karo|shuru\s+karo)\b/i;
const NAME_END =
  '(?=\\s+(?:with|of|worth|target|in|within|by|for|over|duration|at|pkr|rs\\.?|rupees|and|that|which|costing|cost)\\b|\\s+\\d|[.,!?]|$)';

function goalNameOf(text: string): string | undefined {
  const name =
    // "goal of 2 lakh for Umrah", "goal of PKR 50,000 to buy a bike"
    text.match(new RegExp(`goal\\s+(?:of|worth|with\\s+target(?:\\s+of)?)\\s+(?:pkr\\s*|rs\\.?\\s*)?[\\d,.]+(?:\\s*(?:lakh|lac|crore|cr|k|thousand))?\\s+(?:for|called|named|to\\s+buy|to\\s+save\\s+for)\\s+(?:an?\\s+|my\\s+|the\\s+|new\\s+)*([A-Za-z][A-Za-z0-9 &'+-]*?)${NAME_END}`, 'i'))?.[1] ??
    // "goal of bike", "goal for a new car", "goal called Hajj", "goal to buy a laptop"
    text.match(new RegExp(`goal\\s+(?:of|for|called|named|to\\s+buy|to\\s+save\\s+for)\\s+(?:an?\\s+|my\\s+|the\\s+|new\\s+)*([A-Za-z][A-Za-z0-9 &'+-]*?)${NAME_END}`, 'i'))?.[1] ??
    // "bike ke liye goal banao", "Umrah ke liye 2 lakh ka goal"
    text.match(/\b(?:(?:ek|aik|naya|nayi)\s+)?([A-Za-z][A-Za-z ]{1,25}?)\s+(?:ke|ki|k)\s+liye\b/i)?.[1] ??
    // "bike ka goal banao"
    text.match(/\b(?:(?:ek|aik|naya|nayi)\s+)?([A-Za-z][A-Za-z ]{1,25}?)\s+(?:ka|ki)\s+goal\b/i)?.[1] ??
    // "create a bike goal", "make a new car goal"
    text.match(/\b(?:create|make|start|add|set)\s+(?:an?\s+|my\s+|new\s+)*([A-Za-z][A-Za-z ]{1,25}?)\s+goal\b/i)?.[1];
  const clean = name?.trim().replace(/\s+/g, ' ');
  if (!clean || /^(savings?|money|new|my|saving|financial|monthly|mera|meri|apna|apni|is|us|paise|paisay|bachat)$/i.test(clean) || /^\d/.test(clean)) return undefined;
  return clean.replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase()).slice(0, 40);
}

const URDU_COUNT: Record<string, number> = { ek: 1, aik: 1, do: 2, teen: 3, chaar: 4, char: 4, paanch: 5, panch: 5, chhe: 6, chay: 6 };
const WORD_COUNT: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, nine: 9, twelve: 12, eighteen: 18, ten: 10 };
/** "in 6 months", "within a year", "duration of 6 months", "by December 2027" → YYYY-MM-DD. */
function goalDeadlineOf(lower: string, today: Date): string | undefined {
  const span = lower.match(
    /\b(?:in|within|for|over|duration\s+of|period\s+of|next|after)\s+(?:the\s+next\s+)?(\d+|an?|one|two|three|four|five|six|nine|ten|twelve|eighteen)\s*-?\s*(months?|mahine|mahina|years?|yrs?|saal|weeks?)\b/,
  ) ?? lower.match(/\b(\d+|ek|aik|do|teen|chaar|char|paanch|panch|chhe|chay)\s*-?\s*(months?|years?|weeks?|mahine|mahina|saal|hafte|hafton)\b/);
  if (span) {
    const n = /^\d+$/.test(span[1]) ? Number(span[1]) : WORD_COUNT[span[1]] ?? URDU_COUNT[span[1]];
    if (!n || n > 600) return undefined;
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (/^(year|yr|saal)/.test(span[2])) d.setFullYear(d.getFullYear() + n);
    else if (/^(week|haft)/.test(span[2])) d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    return toIsoDate(d);
  }
  const by = lower.match(/\bby\s+(?:the\s+)?(?:end\s+of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s+(\d{4}))?\b/);
  if (by) {
    const month = MONTHS.indexOf(by[1]);
    let year = by[2] ? Number(by[2]) : today.getFullYear();
    let end = new Date(year, month + 1, 0);
    if (!by[2] && end < today) end = new Date(++year, month + 1, 0);
    return end > today ? toIsoDate(end) : undefined;
  }
  return undefined;
}

/**
 * Commands in a message, as proposals for the user to confirm. Questions, negations ("don't add…")
 * and foreign currencies never produce actions.
 */
export function extractExecutableActions(message: string, goalNames: string[] = [], today = new Date()): CaExecutableAction[] {
  const text = normalizeLocal(message).trim();
  const lower = text.toLowerCase();
  if (
    !text ||
    QUESTION.test(lower) ||
    /\bcan\s+i\s+afford\b/.test(lower) ||
    (ROMAN_QUESTION.test(lower) && !ROMAN_ADD.test(lower)) ||
    NEGATION.test(lower) ||
    FOREIGN_CURRENCY.test(lower)
  ) {
    return [];
  }
  const date = toIsoDate(parseDateMention(text, today) ?? today);
  const amount = pickAmount(text);

  // New savings goal ("make a goal of bike for 6 months", "create a 2 lakh goal for Umrah").
  // Without an amount it is still proposed: the card asks for the target.
  // ("add 5000 to my New Laptop goal" is money for a goal, not a new one.)
  const towardsGoal =
    /\b(?:to|into|towards)\s+(?:my\s+|the\s+)?[a-z0-9 &'-]{0,30}\bgoal\b/i.test(lower) ||
    /\bgoal\s+(?:mein|me|main)\b/i.test(lower);
  if (CREATE_GOAL.test(lower) && !towardsGoal && !/\bcontribut/.test(lower)) {
    return [
      {
        kind: 'add_goal',
        amount: amount && amount >= 100 ? amount : 0,
        goalName: goalNameOf(text) ?? 'New Savings Goal',
        deadline: goalDeadlineOf(lower, today),
      },
    ];
  }
  if (!amount) return [];

  // 1. Monthly budget
  if (
    /\b(set|update|change|make|increase|decrease|reduce)\s+(?:my\s+)?(?:monthly\s+)?budget\b|\bbudget\s+(?:to|of|=)\s/i.test(lower) ||
    // "mera budget 80 hazar kar do", "budget 80k set karo"
    /\bbudget\b[^.?!]{0,40}\b(?:kar\s*do|kardo|karo|set\s+karo|rakh\s*do|rakho|kar\s+dein|kar\s+den)\b/i.test(lower)
  ) {
    return [{ kind: 'set_budget', amount }];
  }

  // 2. Money towards an existing goal ("add 10000 to my laptop goal", "put 5k in savings")
  const goal = goalNames.find(n => n && lower.includes(n.toLowerCase()));
  if (
    /\b(add|put|save|move|transfer|deposit|contribute|daal|daalo|jama|bachao|bacha\s+lo)\b/i.test(lower) &&
    (goal || /\b(goal|savings?|bachat)\b/i.test(lower))
  ) {
    return [{ kind: 'add_contribution', amount, goalName: goal ?? (goalNames.length === 1 ? goalNames[0] : undefined), date }];
  }

  // 3. Transactions: a command ("add 500 for lunch") or a statement ("I spent 2000 on groceries")
  const isIncome = INCOME_WORD.test(lower) && !SPENT_VERB.test(lower);
  const command = TX_VERB.test(lower) && (TX_NOUN.test(lower) || /\b(?:for|on|in|ka|ki|ke)\b/i.test(lower) || INCOME_WORD.test(lower)
    || inferTransactionCategory(text, 'expense') !== 'Other');
  const statement =
    SPENT_VERB.test(lower) ||
    /\b(received|earned|got\s+paid|credited|mile|mila|mili|milay|aaye|aaya|aayi|wasool)\b/i.test(lower);
  if (!command && !statement) return [];

  const accountHint = accountHintOf(text);
  const txType: 'expense' | 'income' = isIncome ? 'income' : 'expense';
  return splitItems(text)
    .map(part => {
      const partAmount = pickAmount(part);
      if (!partAmount) return null;
      return {
        kind: 'add_transaction' as const,
        txType,
        amount: partAmount,
        category: inferTransactionCategory(part, txType) !== 'Other' ? inferTransactionCategory(part, txType) : inferTransactionCategory(text, txType),
        note: noteOf(part),
        accountHint,
        date,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);
}

/**
 * An action proposed by the AI model, checked before it can be shown: known kind, a sane amount,
 * a real category, a date that isn't in the future. Anything else is dropped.
 */
export function sanitizeAiAction(raw: unknown, goalNames: string[] = [], today = new Date()): CaExecutableAction | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const kind = a.kind as CaActionKind;
  if (!['add_transaction', 'add_goal', 'set_budget', 'add_contribution'].includes(kind)) return null;
  const amount = typeof a.amount === 'number' ? a.amount : Number(a.amount);
  // A new goal may come without a target (the card asks for it); everything else needs an amount.
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000 || (amount === 0 && kind !== 'add_goal')) return null;

  let date = typeof a.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : toIsoDate(today);
  if (date > toIsoDate(today)) date = toIsoDate(today);
  const txType = a.txType === 'income' ? 'income' : 'expense';
  const note = typeof a.note === 'string' && a.note.trim() ? a.note.trim().slice(0, 40) : undefined;
  const category = TX_CATEGORIES.includes(a.category as ValidTxCategory)
    ? (a.category as ValidTxCategory)
    : inferTransactionCategory(note ?? '', txType);
  const goalName = typeof a.goalName === 'string' && a.goalName.trim() ? a.goalName.trim().slice(0, 60) : undefined;
  return {
    kind,
    amount: Math.round(amount * 100) / 100,
    txType: kind === 'add_transaction' ? txType : undefined,
    category: kind === 'add_transaction' ? category : undefined,
    note,
    accountHint: typeof a.accountHint === 'string' ? a.accountHint : undefined,
    goalName:
      kind === 'add_contribution'
        ? goalNames.find(n => goalName && n.toLowerCase() === goalName.toLowerCase()) ?? goalName
        : kind === 'add_goal'
        ? goalName ?? 'New Savings Goal'
        : goalName,
    date,
    deadline:
      kind === 'add_goal' && typeof a.deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.deadline) && a.deadline > toIsoDate(today)
        ? a.deadline
        : undefined,
  };
}

// ── Memory facts from the AI model: one name per fact, monthly salary ──────

const FACT_KEYS: [RegExp, string][] = [
  [/^(?:(?:monthly|annual|yearly|gross|net)\s+)?(?:salary|income|pay)(?:\s*\((?:monthly|annual|yearly)\))?$/i, 'Salary'],
  [/^(employer|company|workplace|job|organi[sz]ation)$/i, 'Employer'],
  [/^(tax\s*profile|filer\s*status|fbr\s*status|tax\s*status)$/i, 'Tax Profile'],
  [/^(risk(\s*(score|profile|tolerance|appetite))?)$/i, 'Risk Score'],
  [/^(city|location|residence|lives?\s*in)$/i, 'City'],
  [/^(dependents?|family\s*size|children|kids)$/i, 'Dependents'],
  [/^(sec(tion)?\s*62(\s*used)?|section\s*62\s*investment)$/i, 'Sec 62 Used'],
];

/** One canonical key per fact ("Monthly Salary" → "Salary"), and salary always stored per month. */
export function normalizeFact(key: string, value: string): { key: string; value: string } | null {
  const k = key.trim();
  const v = value.trim();
  if (!k || !v) return null;
  const canonical = FACT_KEYS.find(([re]) => re.test(k))?.[1] ?? k.slice(0, 30);
  if (canonical === 'Salary') {
    const n = parsePkrNumber(v);
    if (!n || FOREIGN_CURRENCY.test(v)) return null;
    const monthly = /\b(year|yearly|annual|annually|per\s+annum|p\.?a\.?|\/\s*yr)\b/i.test(v) || /\b(year|annual)/i.test(k) ? n / 12 : n;
    return { key: 'Salary', value: `PKR ${Math.round(monthly).toLocaleString('en-IN')} / mo` };
  }
  return { key: canonical, value: v.slice(0, 80) };
}
