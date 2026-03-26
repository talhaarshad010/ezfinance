export interface PakistaniBank {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  color: string;
  website?: string;
  logo?: string;
}

const PAKISTANI_BANKS: PakistaniBank[] = [
  {
    id: 'sbp',
    name: 'State Bank of Pakistan',
    shortName: 'SBP',
    abbreviation: 'SBP',
    color: '#004B87',
    website: 'sbp.org.pk',
    logo: 'https://logo.bankconv.com/sbp.org.pk?size=128'
  },
  {
    id: 'abl',
    name: 'Allied Bank Limited',
    shortName: 'Allied Bank',
    abbreviation: 'ABL',
    color: '#C8102E',
    website: 'abl.com',
    logo: 'https://logo.bankconv.com/abl.com?size=128'
  },
  {
    id: 'albaraka',
    name: 'Al Baraka Bank (Pakistan) Limited',
    shortName: 'Al Baraka',
    abbreviation: 'ABB',
    color: '#D4AF37',
    website: 'albaraka.com.pk',
    logo: 'https://logo.bankconv.com/albaraka.com.pk?size=128'
  },
  {
    id: 'askari',
    name: 'Askari Bank Limited',
    shortName: 'Askari Bank',
    abbreviation: 'AB',
    color: '#003366',
    website: 'askaribank.com',
    logo: 'https://logo.bankconv.com/askaribank.com?size=128'
  },
  {
    id: 'alfalah',
    name: 'Bank Alfalah Limited',
    shortName: 'Bank Alfalah',
    abbreviation: 'BAF',
    color: '#ED1C24',
    website: 'bankalfalah.com',
    logo: 'https://logo.bankconv.com/bankalfalah.com?size=128'
  },
  {
    id: 'alhabib',
    name: 'Bank AL Habib Limited',
    shortName: 'Bank AL Habib',
    abbreviation: 'BAHL',
    color: '#1E3A5F',
    website: 'bankalhabib.com',
    logo: 'https://logo.bankconv.com/bankalhabib.com?size=128'
  },
  {
    id: 'bankislami',
    name: 'BankIslami Pakistan Limited',
    shortName: 'BankIslami',
    abbreviation: 'BIPL',
    color: '#00843D',
    website: 'bankislami.com.pk',
    logo: 'https://logo.bankconv.com/bankislami.com.pk?size=128'
  },
  {
    id: 'makramah',
    name: 'Bank Makramah Limited',
    shortName: 'Makramah',
    abbreviation: 'BML',
    color: '#004A99',
    website: 'bankmakramah.com',
    logo: 'https://logo.bankconv.com/bankmakramah.com?size=128'
  },
  {
    id: 'bop',
    name: 'The Bank of Punjab',
    shortName: 'BOP',
    abbreviation: 'BOP',
    color: '#8B0000',
    website: 'bop.com.pk',
    logo: 'https://logo.bankconv.com/bop.com.pk?size=128'
  },
  {
    id: 'citibank',
    name: 'Citibank N.A.',
    shortName: 'Citibank',
    abbreviation: 'CITI',
    color: '#003A70',
    website: 'citibank.com',
    logo: 'https://logo.bankconv.com/citibank.com?size=128'
  },
  {
    id: 'deutsche',
    name: 'Deutsche Bank AG (Pakistan)',
    shortName: 'Deutsche Bank',
    abbreviation: 'DB',
    color: '#0018A8',
    website: 'deutschebank.com',
    logo: 'https://logo.bankconv.com/deutschebank.com?size=128'
  },
  {
    id: 'dubaiislamic',
    name: 'Dubai Islamic Bank Pakistan Limited',
    shortName: 'DIB',
    abbreviation: 'DIB',
    color: '#B59461',
    website: 'dubaiislamicbank.ae',
    logo: 'https://logo.bankconv.com/dubaiislamicbank.ae?size=128'
  },
  {
    id: 'faysal',
    name: 'Faysal Bank Limited',
    shortName: 'Faysal Bank',
    abbreviation: 'FB',
    color: '#005C3E',
    website: 'faysalbank.com',
    logo: 'https://logo.bankconv.com/faysalbank.com?size=128'
  },
  {
    id: 'fwbl',
    name: 'First Women Bank Limited',
    shortName: 'FWBL',
    abbreviation: 'FWBL',
    color: '#EC008C',
    website: 'firstwomenbank.com',
    logo: 'https://logo.bankconv.com/firstwomenbank.com?size=128'
  },
  {
    id: 'hbl',
    name: 'Habib Bank Limited',
    shortName: 'HBL',
    abbreviation: 'HBL',
    color: '#006747',
    website: 'hbl.com',
    logo: 'https://logo.bankconv.com/hbl.com?size=128'
  },
  {
    id: 'hmb',
    name: 'Habib Metropolitan Bank Limited',
    shortName: 'HabibMetro',
    abbreviation: 'HMB',
    color: '#003D79',
    website: 'hmb.com.pk',
    logo: 'https://logo.bankconv.com/hmb.com.pk?size=128'
  },
  {
    id: 'icbc',
    name: 'ICBC Pakistan',
    shortName: 'ICBC',
    abbreviation: 'ICBC',
    color: '#C41E3A',
    website: 'icbc.com.cn',
    logo: 'https://logo.bankconv.com/icbc.com.cn?size=128'
  },
  {
    id: 'jsbank',
    name: 'JS Bank Limited',
    shortName: 'JS Bank',
    abbreviation: 'JS',
    color: '#FF6600',
    website: 'jsbl.com',
    logo: 'https://logo.bankconv.com/jsbl.com?size=128'
  },
  {
    id: 'mcb',
    name: 'MCB Bank Limited',
    shortName: 'MCB Bank',
    abbreviation: 'MCB',
    color: '#1E3A5F',
    website: 'mcb.com.pk',
    logo: 'https://logo.bankconv.com/mcb.com.pk?size=128'
  },
  {
    id: 'meezan',
    name: 'Meezan Bank Limited',
    shortName: 'Meezan Bank',
    abbreviation: 'MB',
    color: '#00843D',
    website: 'meezanbank.com',
    logo: 'https://logo.bankconv.com/meezanbank.com?size=128'
  },
  {
    id: 'nbp',
    name: 'National Bank of Pakistan',
    shortName: 'NBP',
    abbreviation: 'NBP',
    color: '#007A33',
    website: 'nbp.com.pk',
    logo: 'https://logo.bankconv.com/nbp.com.pk?size=128'
  },
  {
    id: 'sindh',
    name: 'Sindh Bank Limited',
    shortName: 'Sindh Bank',
    abbreviation: 'SBL',
    color: '#B22222',
    website: 'sindhbank.com.pk',
    logo: 'https://logo.bankconv.com/sindhbank.com.pk?size=128'
  },
  {
    id: 'soneri',
    name: 'Soneri Bank Limited',
    shortName: 'Soneri Bank',
    abbreviation: 'SB',
    color: '#005C3E',
    website: 'soneribank.com',
    logo: 'https://logo.bankconv.com/soneribank.com?size=128'
  },
  {
    id: 'sc',
    name: 'Standard Chartered Bank (Pakistan) Limited',
    shortName: 'Standard Chartered',
    abbreviation: 'SC',
    color: '#0072AA',
    website: 'sc.com',
    logo: 'https://logo.bankconv.com/sc.com?size=128'
  },
  {
    id: 'bok',
    name: 'The Bank of Khyber',
    shortName: 'Bank of Khyber',
    abbreviation: 'BOK',
    color: '#1B5E20',
    website: 'bok.com.pk',
    logo: 'https://logo.bankconv.com/bok.com.pk?size=128'
  },
  {
    id: 'ztbl',
    name: 'Zarai Taraqiati Bank Limited',
    shortName: 'ZTBL',
    abbreviation: 'ZTBL',
    color: '#006400',
    website: 'ztbl.gov.pk',
    logo: 'https://logo.bankconv.com/ztbl.gov.pk?size=128'
  },
  {
    id: 'nayapay',
    name: 'NayaPay',
    shortName: 'NayaPay',
    abbreviation: 'NP',
    color: '#6C3CE1',
    website: 'nayapay.com',
    logo: 'https://logo.bankconv.com/nayapay.com?size=128'
  },
  {
    id: 'sadapay',
    name: 'SadaPay',
    shortName: 'SadaPay',
    abbreviation: 'SP',
    color: '#000000',
    website: 'sadapay.pk',
    logo: 'https://logo.bankconv.com/sadapay.pk?size=128'
  },
];

export default PAKISTANI_BANKS;

export const getBankById = (id: string): PakistaniBank | undefined =>
  PAKISTANI_BANKS.find(b => b.id === id);
