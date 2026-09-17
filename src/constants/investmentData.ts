/**
 * Seed data for the Wealth Engine / Investments module
 * Includes SECP AMCs, mutual funds, risk assessment quiz, and mock charts.
 */

export type WealthView =
  | 'dashboard'
  | 'marketplace'
  | 'positions'
  | 'riskQuiz'
  | 'riskResult'
  | 'fundsLow'
  | 'fundsMed'
  | 'fundsHigh'
  | 'fundDetail'
  | 'amcDetail'
  | 'orderReview'
  | 'secp0'
  | 'secp1'
  | 'secp2'
  | 'secp3'
  | 'secp4';

export type WealthOverlay =
  | null
  | 'riskSelector'
  | 'fundCompare'
  | 'investKeypad'
  | 'execSuccess'
  | 'biometric'
  | 'verifyPending';

export const WEALTH_CHART_DATA = [
  180000, 183500, 181200, 185800, 188400, 184900, 190200, 194600,
  192100, 197300, 201800, 199500, 205400, 208900, 206200, 212700,
  216300, 214100, 220500, 225800, 223400, 229100, 234600, 232000,
  238500, 242900, 240300, 246800, 251200, 248000,
];

export const KSE_DATA = [
  72000, 72500, 72200, 73100, 73800, 73400, 74200, 74900, 74500, 75200,
  75800, 75400, 76100, 76800, 76300, 77100, 77600, 77200, 78000, 78400,
];

export const MRAF_DATA = [
  48.0, 48.2, 48.3, 48.5, 48.7, 48.8, 49.0, 49.1, 49.3, 49.4,
  49.5, 49.6, 49.7, 49.8, 49.9, 50.0, 50.05, 50.1, 50.15, 50.2,
];

export interface AMCItem {
  id: string;
  name: string;
  rating: string;
  aum: string;
  type: string;
  ytd: string;
  funds: number;
  since: string;
  custodian: string;
}

export const AMCS: AMCItem[] = [
  {
    id: 'almeezan',
    name: 'Al Meezan Investment Management',
    rating: 'AM1',
    aum: '285.4B',
    type: 'Shariah',
    ytd: '+14.2%',
    funds: 12,
    since: '1995',
    custodian: 'CDC Pakistan',
  },
  {
    id: 'nbp',
    name: 'NBP Fund Management Limited',
    rating: 'AM1',
    aum: '148.2B',
    type: 'Conventional',
    ytd: '+11.8%',
    funds: 8,
    since: '2001',
    custodian: 'MCB Financial Services',
  },
  {
    id: 'mcb',
    name: 'MCB-Arif Habib Savings',
    rating: 'AM1',
    aum: '97.6B',
    type: 'Both',
    ytd: '+12.5%',
    funds: 10,
    since: '2003',
    custodian: 'CDC Pakistan',
  },
  {
    id: 'ubl',
    name: 'UBL Fund Managers',
    rating: 'AM1',
    aum: '83.1B',
    type: 'Both',
    ytd: '+10.4%',
    funds: 7,
    since: '2001',
    custodian: 'CDC Pakistan',
  },
  {
    id: 'lakson',
    name: 'Lakson Investments Limited',
    rating: 'AM2+',
    aum: '45.8B',
    type: 'Conventional',
    ytd: '+9.7%',
    funds: 5,
    since: '2006',
    custodian: 'KASB Financial Services',
  },
];

export interface FundItem {
  id: string;
  name: string;
  shortName: string;
  yieldPct?: number;
  fiveYrReturn?: number;
  vol?: number;
  exitLoad: string;
  instant?: boolean;
  nav: number;
  aum: string;
  category: string;
  manager: string;
  shariah: boolean;
  sec62: boolean;
  mgmtFee: string;
  shariadvisor?: string;
  minInvest: string;
  tenure?: string;
  underlying?: string;
  holdings?: string[];
}

export const FUNDS_LOW: FundItem[] = [
  {
    id: 'mraf',
    name: 'Meezan Rozana Amdani Fund',
    shortName: 'MRAF',
    yieldPct: 12.8,
    vol: 0.2,
    exitLoad: '0.0%',
    instant: true,
    nav: 50.0,
    aum: 'PKR 82.4B',
    category: 'Money Market',
    manager: 'Al Meezan Investment Mgmt',
    shariah: true,
    sec62: true,
    mgmtFee: '0.45% p.a.',
    shariadvisor: 'Dr. Muhammad Imran Ashraf Usmani',
    minInvest: '1,000',
  },
  {
    id: 'nbpmm',
    name: 'NBP Money Market Fund',
    shortName: 'NBP-MM',
    yieldPct: 13.1,
    vol: 0.3,
    exitLoad: '0.0%',
    instant: false,
    nav: 102.4,
    aum: 'PKR 45.1B',
    category: 'Money Market',
    manager: 'NBP Fund Management Limited',
    shariah: false,
    sec62: true,
    mgmtFee: '0.60% p.a.',
    shariadvisor: 'N/A (Conventional)',
    minInvest: '5,000',
  },
];

export const FUNDS_MED: FundItem[] = [
  {
    id: 'msf',
    name: 'Meezan Sovereign Fund',
    shortName: 'MSF',
    yieldPct: 15.4,
    tenure: '1-3 Years',
    underlying: 'GOP Ijarah Sukuks',
    nav: 120.5,
    aum: 'PKR 38.2B',
    category: 'Sukuk',
    manager: 'Al Meezan Investment Mgmt',
    shariah: true,
    sec62: true,
    mgmtFee: '0.60% p.a.',
    exitLoad: '0.5% within 30 days',
    minInvest: '10,000',
  },
  {
    id: 'mcbsov',
    name: 'MCB Pakistan Sovereign Fund',
    shortName: 'MCBPSF',
    yieldPct: 15.8,
    tenure: '1-3 Years',
    underlying: 'Corporate & Gov Debt',
    nav: 86.3,
    aum: 'PKR 28.7B',
    category: 'Fixed Income',
    manager: 'MCB-Arif Habib Savings',
    shariah: false,
    sec62: false,
    mgmtFee: '0.75% p.a.',
    exitLoad: '1.0% within 90 days',
    minInvest: '5,000',
  },
];

export const FUNDS_HIGH: FundItem[] = [
  {
    id: 'mif',
    name: 'Meezan Islamic Fund',
    shortName: 'MIF',
    yieldPct: 24.1,
    fiveYrReturn: 84.2,
    holdings: [
      'Oil & Gas Dev Co (OGDC)',
      'Meezan Bank (MEBL)',
      'Fauji Fertilizer (FFC)',
    ],
    nav: 186.4,
    aum: 'PKR 61.8B',
    category: 'Equity',
    manager: 'Al Meezan Investment Mgmt',
    shariah: true,
    sec62: true,
    mgmtFee: '2.00% p.a.',
    exitLoad: '0.0% after 2 years',
    minInvest: '5,000',
  },
];

export const ALL_FUNDS: FundItem[] = [
  ...FUNDS_LOW,
  ...FUNDS_MED,
  ...FUNDS_HIGH,
];

export const QUIZ_QUESTIONS = [
  {
    q: 'What is your primary investment objective?',
    opts: ['Capital Preservation', 'Regular Income', 'Long-Term Growth'],
  },
  {
    q: 'What is your investment horizon?',
    opts: ['< 6 Months', '1 – 3 Years', '5+ Years'],
  },
  {
    q: 'How do you react to a 10% market correction?',
    opts: ['Liquidate immediately', 'Hold position', 'Buy more'],
  },
];

export const SCORE_WEIGHTS = [
  [0, 20, 40],
  [0, 15, 30],
  [0, 15, 30],
];

export interface PositionItem {
  id: string;
  name: string;
  units: number;
  nav: number;
  costNav: number;
  dailyDiv: number;
  allTimeGain: number;
}

export const ACTIVE_POSITIONS: PositionItem[] = [
  {
    id: 'mraf',
    name: 'Meezan Rozana Amdani Fund',
    units: 3200.0,
    nav: 50.0,
    costNav: 43.2,
    dailyDiv: 17.8,
    allTimeGain: 21760,
  },
  {
    id: 'msf',
    name: 'Meezan Sovereign Fund',
    units: 832.5,
    nav: 120.5,
    costNav: 106.8,
    dailyDiv: 5.2,
    allTimeGain: 11402,
  },
  {
    id: 'mif',
    name: 'Meezan Islamic Fund',
    units: 162.0,
    nav: 186.4,
    costNav: 101.2,
    dailyDiv: 0,
    allTimeGain: 13806,
  },
];

export const MARKET_FILTERS = [
  'All Funds',
  'Shariah',
  'Conventional',
  'High Yield',
  'Tax-Rebate',
];
