import { Transaction } from '../store/slices/bankAccountsSlice';

interface ParsedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category?: string;
  createdAt: number;
}

// Column keyword groups
const DATE_KW = ['date', 'timestamp', 'txn date', 'transaction date', 'posting date', 'value date', 'dated'];
const DESC_KW = ['description', 'narration', 'particular', 'particulars', 'detail', 'details', 'remarks', 'memo'];
const DEBIT_KW = ['debit', 'withdrawal', 'withdrawals', 'debit amount', 'dr', 'outflow', 'money out'];
const CREDIT_KW = ['credit', 'deposit', 'deposits', 'credit amount', 'cr', 'inflow', 'money in'];
const AMOUNT_KW = ['amount', 'value', 'transaction amount', 'txn amount'];
const TYPE_KW = ['type', 'transaction type', 'txn type'];
const BALANCE_KW = ['balance', 'running balance', 'available balance', 'closing'];

// Transaction type hints
const INCOME_HINTS = ['in', 'received', 'credit', 'deposit', 'inbound', 'plus', 'add', 'cr', 'ibft in', 'raast in', 'salary'];
const EXPENSE_HINTS = ['out', 'paid', 'debit', 'withdrawal', 'outbound', 'minus', 'sub', 'dr', 'ibft out', 'raast out', 'pos', 'cash withdrawal'];

/**
 * Smart CSV parser for Pakistani bank statements.
 * Handles NayaPay, HBL, Meezan, JazzCash, Easypaisa, SadaPay formats.
 */
export function parseCSV(csvText: string): ParsedTransaction[] {
  // Clean text: handle different line endings, BOM, etc.
  const cleaned = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const allLines = cleaned.split('\n');

  console.log('[CSV Parser] Processing', allLines.length, 'lines');

  // STEP 1: Find the REAL header row
  // A valid header MUST contain at least one DATE keyword AND one DESC or AMOUNT keyword
  let headerIdx = -1;
  let headerCols: string[] = [];

  for (let i = 0; i < Math.min(allLines.length, 40); i++) {
    const line = allLines[i].trim();
    if (!line || line.length < 10) continue;

    // Skip summary rows explicitly
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('opening balance') || lowerLine.includes('closing balance') || lowerLine.includes('total ')) continue;

    const cols = parseCSVLine(line);
    const norm = cols.map(c => c.trim().toLowerCase().replace(/["'#.]/g, '').replace(/\s+/g, ' ').trim());

    let hasDate = false;
    let hasDescOrAmount = false;
    
    for (const col of norm) {
      if (!col) continue;
      if (DATE_KW.includes(col) || DATE_KW.some(kw => col.includes(kw))) hasDate = true;
      if (DESC_KW.includes(col) || AMOUNT_KW.includes(col) || TYPE_KW.includes(col)) hasDescOrAmount = true;
    }

    if (hasDate && hasDescOrAmount) {
      headerIdx = i;
      headerCols = norm;
      console.log('[CSV Parser] Header found at line', i, ':', cols);
      break;
    }
  }

  let transactions: ParsedTransaction[] = [];

  if (headerIdx !== -1) {
    transactions = parseWithHeader(allLines, headerIdx, headerCols);
  } else {
    console.log('[CSV Parser] Header not found, falling back to pattern scan');
    transactions = patternScan(allLines);
  }

  if (transactions.length === 0) {
    throw new Error('Could not find any transactions in this file. Please ensure it is a valid CSV statement.');
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log('[CSV Parser] Successfully parsed', transactions.length, 'transactions');
  return transactions;
}

// ==========================================
// Parsing with Header Info
// ==========================================
function parseWithHeader(allLines: string[], headerIdx: number, headerCols: string[]): ParsedTransaction[] {
  const findCol = (keywords: string[]) =>
    headerCols.findIndex(h => keywords.includes(h) || keywords.some(kw => h.includes(kw)));

  const dateIdx = findCol(DATE_KW);
  const descIdx = findCol(DESC_KW);
  const typeIdx = findCol(TYPE_KW);
  const debitIdx = findCol(DEBIT_KW);
  const creditIdx = findCol(CREDIT_KW);
  const amountIdx = findCol(AMOUNT_KW);
  const balanceIdx = findCol(BALANCE_KW);

  console.log('[CSV Parser] Column Mapping:', { dateIdx, descIdx, typeIdx, amountIdx, debitIdx, creditIdx, balanceIdx });

  const transactions: ParsedTransaction[] = [];

  for (let i = headerIdx + 1; i < allLines.length; i++) {
    const line = allLines[i].trim();
    if (!line) continue;
    if (isMetadataRow(line.toLowerCase())) continue;

    const cols = parseCSVLine(line);
    if (cols.length < 2) continue;

    // --- 1. Date ---
    let dateStr = dateIdx !== -1 ? cols[dateIdx]?.trim() : '';
    if (!dateStr || !looksLikeDate(dateStr)) continue;

    // --- 2. Description ---
    let description = descIdx !== -1 ? cols[descIdx]?.trim() : '';
    let typeHint = typeIdx !== -1 ? cols[typeIdx]?.trim().toLowerCase() : '';
    if (typeHint && description) {
      // Append type to description if it's brief
      if (description.length < 15) description = `${typeHint.toUpperCase()} - ${description}`;
    } else if (!description && typeHint) {
      description = typeHint.toUpperCase();
    }
    if (!description) description = 'Transaction';

    // --- 3. Amount & Type ---
    let amount = 0;
    let type: 'income' | 'expense' = 'expense';

    // Priority 1: Debit/Credit Columns
    if (debitIdx !== -1 || creditIdx !== -1) {
      const db = debitIdx !== -1 ? parseAmount(cols[debitIdx]) : 0;
      const cr = creditIdx !== -1 ? parseAmount(cols[creditIdx]) : 0;
      if (cr > 0) {
        amount = cr;
        type = 'income';
      } else if (db > 0) {
        amount = db;
        type = 'expense';
      }
    }

    // Priority 2: Single Amount Column
    if (amount === 0 && amountIdx !== -1) {
      const val = parseAmount(cols[amountIdx]);
      if (val !== 0) {
        amount = Math.abs(val);
        // If the number itself is negative, it's an expense
        if (cols[amountIdx].includes('-') || val < 0) {
          type = 'expense';
        } else if (cols[amountIdx].includes('+') || val > 0) {
          type = 'income';
        }
        
        // Final sanity check with type hint column
        if (typeHint) {
          if (INCOME_HINTS.some(hint => typeHint.includes(hint))) type = 'income';
          if (EXPENSE_HINTS.some(hint => typeHint.includes(hint))) type = 'expense';
        }
      }
    }

    if (amount === 0) continue;

    transactions.push({
      description,
      amount,
      type,
      date: normalizeDate(dateStr),
      createdAt: Date.now(),
    });
  }

  return transactions;
}

// ==========================================
// Fallback Pattern Scan
// ==========================================
function patternScan(allLines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (const line of allLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 15) continue;
    if (isMetadataRow(trimmed.toLowerCase())) continue;

    const cols = parseCSVLine(trimmed);
    
    // Find date field
    let dateIdx = -1;
    let dateStr = '';
    for (let i = 0; i < cols.length; i++) {
        if (looksLikeDate(cols[i])) {
            dateIdx = i;
            dateStr = cols[i].trim();
            break;
        }
    }
    if (dateIdx === -1) continue;

    // Find numeric fields (excluding date)
    const numerics: { idx: number, val: number, raw: string }[] = [];
    for (let i = 0; i < cols.length; i++) {
        if (i === dateIdx) continue;
        const v = parseAmount(cols[i]);
        if (v !== 0) numerics.push({ idx: i, val: v, raw: cols[i] });
    }

    if (numerics.length === 0) continue;

    // In a row with [Date, Desc/Type, Amount, Balance], amount is usually second-to-last or last non-date numeric
    // Let's take the first non-zero numeric which isn't the last column (likely balance)
    let amountObj = numerics.length >= 2 ? numerics[0] : numerics[0];
    let amount = Math.abs(amountObj.val);
    let type: 'income' | 'expense' = (amountObj.raw.includes('-') || amountObj.val < 0) ? 'expense' : 'income';

    // Description: Longest non-numeric, non-date field
    let description = '';
    for (let i = 0; i < cols.length; i++) {
        if (i === dateIdx || numerics.some(n => n.idx === i)) continue;
        const v = cols[i].trim();
        if (v.length > description.length) description = v;
    }
    if (!description) description = 'Transaction';

    transactions.push({
        description,
        amount,
        type,
        date: normalizeDate(dateStr),
        createdAt: Date.now(),
    });
  }

  return transactions;
}

// ==========================================
// Helpers
// ==========================================

function isMetadataRow(lower: string): boolean {
  const skip = [
    'opening balance', 'closing balance', 'total spent', 'total income',
    'customer name', 'account statement', 'generated on', 'transaction limit'
  ];
  return skip.some(phrase => lower.includes(phrase));
}

function looksLikeDate(str: string | undefined): boolean {
  if (!str) return false;
  const s = str.trim();
  // DD-MMM-YYYY or DD MMM YYYY
  if (/\d{1,2}[\s\-]\w{3}[\s\-]\d{4}/i.test(s)) return true;
  // DD/MM/YYYY or YYYY-MM-DD
  if (/\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}/.test(s)) return true;
  return false;
}

function parseAmount(str: string | undefined): number {
  if (!str) return 0;
  // Strip commas and whitespace
  let s = str.trim().replace(/,/g, '');
  // Extract number including sign
  const match = s.match(/[\-+]?\s*[0-9]+(\.[0-9]+)?/);
  if (!match) return 0;
  // Strip internal spaces after sign
  const val = parseFloat(match[0].replace(/\s+/g, ''));
  return isNaN(val) ? 0 : val;
}

function normalizeDate(raw: string): string {
  const s = raw.trim();
  
  // Try common format: DD MMM YYYY (2 Feb 2026)
  const parts = s.split(/[\s\-]/);
  if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1].toLowerCase().substring(0, 3);
      const year = parseInt(parts[2]);
      
      const months: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      
      if (!isNaN(day) && !isNaN(year) && months[monthStr]) {
          return `${year}-${months[monthStr]}-${day.toString().padStart(2, '0')}`;
      }
  }

  // Fallback to standard JS Date parsing
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  
  return new Date().toISOString().split('T')[0];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
