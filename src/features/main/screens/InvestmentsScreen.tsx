import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ViewType = 'risk' | 'market' | 'portfolio' | 'kyc';

const AMCS = [
  { id: 'almeezan', name: 'Al Meezan Investment', rating: 'AM1', aum: '285.4B', type: 'Shariah', ytd: '+14.2%' },
  { id: 'nbp', name: 'NBP Funds Management', rating: 'AM1', aum: '148.2B', type: 'Conventional', ytd: '+11.8%' },
  { id: 'mcb', name: 'MCB-Arif Habib Savings', rating: 'AM2+', aum: '97.6B', type: 'Both', ytd: '+12.5%' },
  { id: 'ubl', name: 'UBL Fund Managers', rating: 'AM2+', aum: '83.1B', type: 'Both', ytd: '+10.4%' },
  { id: 'lakson', name: 'Lakson Investments', rating: 'AM3+', aum: '45.8B', type: 'Conventional', ytd: '+9.7%' },
];

const CHART_VALUES = [
  215000, 216200, 214800, 217500, 219000, 218200, 221000, 220500, 223400,
  225000, 224200, 227800, 229100, 228000, 231500, 233000, 232100, 236000,
  238500, 240000, 239200, 242000, 244500, 243800, 246000, 248000,
];

const KSE_VALUES = [
  72000, 72300, 71900, 72800, 73200, 73000, 73900, 74200, 74000, 74800, 75400, 76100,
];

const KYC_STEPS = [
  { label: 'CNIC Verification', desc: 'Upload front & back of your CNIC', done: true, active: false },
  { label: 'IBAN Configuration', desc: 'Link your bank account for settlement', done: true, active: false },
  { label: 'Biometric Check', desc: 'Live face match against NADRA database', done: false, active: true },
  { label: 'Risk Profile', desc: 'Dynamic questionnaire — 6 questions', done: false, active: false },
];

const RISK_TIERS = [
  {
    tier: 'LOW',
    label: 'Government Sukuks / Cash Funds',
    desc: 'Capital-protected sovereign instruments with daily liquidity.',
    yield: '+12.5% Annualized',
    examples: ['Meezan Rozana Amdani', 'NBP Money Market Fund'],
  },
  {
    tier: 'MEDIUM',
    label: 'Income & Capital Protected Funds',
    desc: 'Diversified income funds from SECP-registered AMCs.',
    yield: '+16.8% Annualized',
    examples: ['Al Meezan Income Fund', 'NBP Funds Income', 'MCB-AH Cash Mgmt'],
  },
  {
    tier: 'HIGH',
    label: 'Equity Portfolios (KSE-100)',
    desc: 'Full market exposure via equity funds tracking KSE-100 index.',
    yield: '+24.1% YTD',
    examples: ['NBP Stock Fund', 'UBL Growth & Income'],
  },
];

function MiniLineChart({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const chartWidth = SCREEN_WIDTH - 72;
  const chartHeight = 50;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * chartWidth;
      const y = chartHeight - 5 - ((val - min) / range) * (chartHeight - 10);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={styles.chartWrap}>
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      </Svg>
    </View>
  );
}

function PortfolioLineChart({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const chartWidth = SCREEN_WIDTH - 72;
  const chartHeight = 100;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * chartWidth;
      const y = chartHeight - 10 - ((val - min) / range) * (chartHeight - 20);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${chartHeight} ` + points + ` ${chartWidth},${chartHeight}`;

  return (
    <View style={styles.chartWrap}>
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={`M ${areaPoints} Z`} fill="url(#portGrad)" />
        <Polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
      </Svg>
    </View>
  );
}

function InvestKeypad({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [val, setVal] = useState('10000');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

  function tap(k: string) {
    if (k === '⌫') {
      setVal(v => v.slice(0, -1) || '0');
    } else if (val === '0') {
      setVal(k === '000' ? '0' : k);
    } else {
      setVal(v => v + k);
    }
  }

  function handleInvest() {
    const num = parseInt(val || '0', 10);
    if (num <= 0) {
      showToast('Please enter a valid investment amount', 'error', 'Investment');
      return;
    }
    showToast(`Invested PKR ${num.toLocaleString()} in Meezan Rozana Amdani Fund`, 'success', 'Order Submitted');
    onClose();
  }

  const numVal = parseInt(val || '0', 10);
  const estMonthlyYield = Math.round((numVal * 0.224) / 12);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.sheetContent, { backgroundColor: theme.CARD }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.TEXT }]}>
              Invest Amount
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.MODAL }]}
            >
              <Feather name="x" size={14} color={theme.MUTED} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.fundSubhead, { color: theme.MUTED }]}>
            Meezan Rozana Amdani Fund
          </Text>

          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.MUTED }]}>
              PKR
            </Text>
            <Text style={[styles.amountDisplay, { color: theme.TEXT }]}>
              {numVal.toLocaleString()}
            </Text>
            <Text style={[styles.yieldText, { color: theme.MUTED }]}>
              Est. yield:{' '}
              <Text style={{ color: theme.GREEN, fontWeight: '700' }}>
                +{estMonthlyYield.toLocaleString()} / mo
              </Text>
            </Text>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            {['5,000', '10,000', '25,000', '50,000'].map(p => (
              <TouchableOpacity
                key={p}
                activeOpacity={0.8}
                onPress={() => setVal(p.replace(/,/g, ''))}
                style={[styles.presetBtn, { backgroundColor: theme.MODAL }]}
              >
                <Text style={[styles.presetBtnText, { color: theme.TEXT }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Keypad Grid */}
          <View style={styles.keypadGrid}>
            {keys.map(k => (
              <TouchableOpacity
                key={k}
                activeOpacity={0.7}
                onPress={() => tap(k)}
                style={[styles.keyBtn, { backgroundColor: theme.MODAL }]}
              >
                <Text style={[styles.keyBtnText, { color: theme.TEXT }]}>
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Invest CTA Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleInvest}
            style={[styles.submitBtn, { backgroundColor: theme.TEXT }]}
          >
            <Text style={[styles.submitBtnText, { color: theme.BG }]}>
              Invest PKR {numVal.toLocaleString()} →
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const InvestmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [view, setView] = useState<ViewType>('risk');
  const [riskLevel, setRiskLevel] = useState(5);
  const [showKeypad, setShowKeypad] = useState(false);

  const activeTier = riskLevel <= 4 ? 0 : riskLevel <= 7 ? 1 : 2;

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            {view !== 'risk' && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setView('risk')}
                style={styles.backBtn}
              >
                <Feather name="chevron-left" size={14} color={theme.MUTED} />
                <Text style={[styles.backText, { color: theme.MUTED }]}>
                  Back
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.headerTitle, { color: theme.TEXT }]}>
              {view === 'risk'
                ? 'Wealth Engine'
                : view === 'market'
                ? 'AMC Marketplace'
                : view === 'portfolio'
                ? 'Portfolio'
                : 'SECP KYC'}
            </Text>
          </View>

          <View style={styles.quickNavRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView('market')}
              style={[
                styles.navBtn,
                { backgroundColor: view === 'market' ? theme.TEXT : theme.CARD },
              ]}
            >
              <Feather
                name="sliders"
                size={15}
                color={view === 'market' ? theme.BG : theme.MUTED}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView('portfolio')}
              style={[
                styles.navBtn,
                {
                  backgroundColor:
                    view === 'portfolio' ? theme.TEXT : theme.CARD,
                },
              ]}
            >
              <Feather
                name="trending-up"
                size={15}
                color={view === 'portfolio' ? theme.BG : theme.MUTED}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView('kyc')}
              style={[
                styles.navBtn,
                { backgroundColor: view === 'kyc' ? theme.TEXT : theme.CARD },
              ]}
            >
              <Feather
                name="shield"
                size={15}
                color={view === 'kyc' ? theme.BG : theme.MUTED}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── View 1: Three-Tier Risk Selector ── */}
        {view === 'risk' && (
          <View>
            {/* Risk Stepper Pills Header */}
            <View style={styles.riskHeaderBox}>
              <View style={styles.riskHeaderTop}>
                <Text style={[styles.riskLabel, { color: theme.MUTED }]}>
                  Risk Tier
                </Text>
                <View style={styles.riskValueRow}>
                  <Text style={[styles.riskValueBig, { color: theme.TEXT }]}>
                    {riskLevel}
                  </Text>
                  <Text style={[styles.riskValueMax, { color: theme.MUTED }]}>
                    /10
                  </Text>
                </View>
              </View>

              {/* Interactive Pills Stepper */}
              <View style={styles.stepperRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                  const isSelected = val === riskLevel;
                  return (
                    <TouchableOpacity
                      key={val}
                      activeOpacity={0.8}
                      onPress={() => setRiskLevel(val)}
                      style={[
                        styles.stepPill,
                        {
                          backgroundColor: isSelected
                            ? theme.ACTIVE
                            : val <= riskLevel
                            ? `${theme.ACTIVE}50`
                            : theme.MODAL,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepPillText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : val <= riskLevel
                              ? theme.TEXT
                              : theme.MUTED,
                          },
                        ]}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3 Risk Tier Cards */}
            <View style={styles.tiersList}>
              {RISK_TIERS.map((tier, i) => {
                const isActive = activeTier === i;
                return (
                  <View
                    key={tier.tier}
                    style={[
                      styles.tierCard,
                      {
                        backgroundColor: isActive ? theme.HERO_BG : theme.CARD,
                        borderColor: isActive ? `${theme.ACTIVE}50` : 'transparent',
                        opacity: isActive ? 1 : 0.4,
                      },
                    ]}
                  >
                    <View style={styles.tierHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.tierTag,
                            { color: isActive ? theme.ACTIVE : theme.MUTED },
                          ]}
                        >
                          {tier.tier} RISK
                        </Text>
                        <Text
                          style={[
                            styles.tierTitle,
                            { color: isActive ? '#FFFFFF' : theme.TEXT },
                          ]}
                        >
                          {tier.label}
                        </Text>
                      </View>
                      <Text style={[styles.tierYield, { color: theme.GREEN }]}>
                        {tier.yield}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.tierDesc,
                        {
                          color: isActive
                            ? 'rgba(255,255,255,0.5)'
                            : theme.MUTED,
                        },
                      ]}
                    >
                      {tier.desc}
                    </Text>

                    {/* KSE Chart for High Tier when active */}
                    {tier.tier === 'HIGH' && isActive && (
                      <MiniLineChart data={KSE_VALUES} color={theme.GREEN} />
                    )}

                    <View style={styles.examplesWrap}>
                      {tier.examples.map(ex => (
                        <View
                          key={ex}
                          style={[
                            styles.examplePill,
                            {
                              backgroundColor: isActive
                                ? 'rgba(255,255,255,0.1)'
                                : theme.MODAL,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.exampleText,
                              {
                                color: isActive
                                  ? 'rgba(255,255,255,0.6)'
                                  : theme.MUTED,
                              },
                            ]}
                          >
                            {ex}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {isActive && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setShowKeypad(true)}
                        style={[
                          styles.tierCtaBtn,
                          { backgroundColor: theme.ACTIVE },
                        ]}
                      >
                        <Text style={styles.tierCtaText}>
                          Invest at this Risk Level →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── View 2: AMC Marketplace ── */}
        {view === 'market' && (
          <View>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.summaryLabel, { color: theme.MUTED }]}>
                  Portfolio
                </Text>
                <Text style={[styles.summaryValBig, { color: theme.TEXT }]}>
                  2,48,000
                </Text>
                <Text style={[styles.todayTag, { color: theme.GREEN }]}>
                  today
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.summaryLabel, { color: theme.MUTED }]}>
                  Day P&L
                </Text>
                <Text style={[styles.summaryValBig, { color: theme.GREEN }]}>
                  +1,240
                </Text>
                <Text style={[styles.todayTag, { color: theme.GREEN }]}>
                  today
                </Text>
              </View>
            </View>

            <View style={styles.amcSection}>
              <Text style={[styles.secLabel, { color: theme.MUTED }]}>
                SECP-Registered Partners
              </Text>
              <View style={[styles.amcCardList, { backgroundColor: theme.CARD }]}>
                {AMCS.map((amc, i) => (
                  <TouchableOpacity
                    key={amc.id}
                    activeOpacity={0.8}
                    onPress={() => setShowKeypad(true)}
                    style={[
                      styles.amcRow,
                      {
                        borderBottomWidth: i < AMCS.length - 1 ? 1 : 0,
                        borderBottomColor: theme.BORDER,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.amcTitleRow}>
                        <Text style={[styles.amcName, { color: theme.TEXT }]}>
                          {amc.name}
                        </Text>
                        <View
                          style={[
                            styles.ratingBadge,
                            { backgroundColor: theme.MODAL },
                          ]}
                        >
                          <Text
                            style={[styles.ratingText, { color: theme.MUTED }]}
                          >
                            {amc.rating}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.amcSub, { color: theme.MUTED }]}>
                        AUM PKR {amc.aum} · {amc.type}
                      </Text>
                    </View>
                    <View style={styles.amcRightRow}>
                      <Text
                        style={[
                          styles.amcYtd,
                          {
                            color: amc.ytd.startsWith('+')
                              ? theme.GREEN
                              : theme.RED,
                          },
                        ]}
                      >
                        {amc.ytd}
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={theme.MUTED}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── View 3: Portfolio Overview ── */}
        {view === 'portfolio' && (
          <View>
            <View style={styles.sectionMargin}>
              <View style={[styles.portfolioHeroCard, { backgroundColor: theme.CARD }]}>
                <Text style={[styles.secLabel, { color: theme.MUTED }]}>
                  Total Portfolio
                </Text>
                <Text style={[styles.portAmountText, { color: theme.TEXT }]}>
                  2,48,000
                </Text>
                <Text style={[styles.portCurrencyText, { color: theme.MUTED }]}>
                  PKR
                </Text>

                <View style={styles.gainsRow}>
                  <Text style={[styles.gainBadge, { color: theme.GREEN }]}>
                    +32,400 unrealised
                  </Text>
                  <Text style={[styles.gainBadge, { color: theme.GREEN }]}>
                    +14.8%
                  </Text>
                </View>

                <PortfolioLineChart data={CHART_VALUES} color={theme.ACTIVE} />

                {/* Timeframe Filter Pills */}
                <View style={styles.timeframesRow}>
                  {['1W', '1M', '3M', '6M', '1Y'].map((r, i) => {
                    const isActive = i === 1;
                    return (
                      <TouchableOpacity
                        key={r}
                        activeOpacity={0.8}
                        style={[
                          styles.timePill,
                          {
                            backgroundColor: isActive
                              ? theme.TEXT
                              : theme.MODAL,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.timePillText,
                            {
                              color: isActive ? theme.BG : theme.MUTED,
                            },
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={[styles.detailsCard, { backgroundColor: theme.CARD }]}>
              {[
                { label: 'Holding Period', value: '8 months', color: theme.TEXT },
                { label: 'CGT Rate (< 1yr)', value: '15%', color: theme.TEXT },
                { label: 'Estimated CGT', value: 'PKR 4,860', color: theme.RED },
                { label: 'Div. Reinvestment', value: 'Active ✓', color: theme.GREEN },
              ].map((row, i) => (
                <View
                  key={row.label}
                  style={[
                    styles.detailRow,
                    {
                      borderBottomWidth: i < 3 ? 1 : 0,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.detailLabel, { color: theme.MUTED }]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.detailValue, { color: row.color }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── View 4: SECP KYC ── */}
        {view === 'kyc' && (
          <View>
            <View style={styles.sectionMargin}>
              <View style={[styles.kycHeroBanner, { backgroundColor: theme.ACTIVE }]}>
                <Text style={styles.kycSahulatTag}>SECP Sahulat Account</Text>
                <Text style={styles.kycDescText}>
                  Step 3 of 4 — Complete biometric verification. Investment
                  cap: PKR 3,000,000.
                </Text>
                <View style={styles.kycTrackBg}>
                  <View style={styles.kycTrackFill} />
                </View>
              </View>

              <View style={[styles.kycCardList, { backgroundColor: theme.CARD }]}>
                {KYC_STEPS.map((step, i) => {
                  const isDimmed = !step.done && !step.active;
                  return (
                    <View
                      key={step.label}
                      style={[
                        styles.kycRow,
                        {
                          borderBottomWidth: i < KYC_STEPS.length - 1 ? 1 : 0,
                          borderBottomColor: theme.BORDER,
                          opacity: isDimmed ? 0.4 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.stepBadgeCircle,
                          {
                            backgroundColor: step.done ? theme.TEXT : theme.MODAL,
                            borderWidth: step.active ? 2 : 0,
                            borderColor: theme.TEXT,
                          },
                        ]}
                      >
                        {step.done ? (
                          <Text style={[styles.stepDoneCheck, { color: theme.BG }]}>
                            ✓
                          </Text>
                        ) : (
                          <Text style={[styles.stepNumText, { color: theme.TEXT }]}>
                            {i + 1}
                          </Text>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.stepTitle,
                            {
                              color: theme.TEXT,
                              fontWeight: step.active ? '700' : '500',
                            },
                          ]}
                        >
                          {step.label}
                        </Text>
                        <Text style={[styles.stepDesc, { color: theme.MUTED }]}>
                          {step.desc}
                        </Text>
                        {step.active && (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                              useToast().showToast(
                                'Biometric scan initialized with NADRA.',
                                'info',
                                'Biometric Scan',
                              )
                            }
                            style={[
                              styles.scanCtaBtn,
                              { backgroundColor: theme.TEXT },
                            ]}
                          >
                            <Text style={[styles.scanCtaText, { color: theme.BG }]}>
                              Start Biometric Scan →
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {step.done && (
                        <Text style={[styles.doneTagText, { color: theme.GREEN }]}>
                          Done
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Invest Keypad Modal */}
      {showKeypad && <InvestKeypad onClose={() => setShowKeypad(false)} />}
    </View>
  );
};

export default InvestmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  backText: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskHeaderBox: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  riskHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  riskValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  riskValueBig: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -1,
  },
  riskValueMax: {
    fontSize: 11,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  stepPill: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tiersList: {
    gap: 12,
  },
  tierCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tierTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  tierYield: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 12,
  },
  tierDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  chartWrap: {
    marginVertical: 8,
    alignItems: 'center',
  },
  examplesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  examplePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  exampleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tierCtaBtn: {
    width: '100%',
    marginTop: 14,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryValBig: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  todayTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  amcSection: {
    marginTop: 4,
  },
  secLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  amcCardList: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  amcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  amcTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  amcName: {
    fontSize: 13,
    fontWeight: '700',
  },
  ratingBadge: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '700',
  },
  amcSub: {
    fontSize: 11,
  },
  amcRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amcYtd: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionMargin: {
    marginBottom: 12,
  },
  portfolioHeroCard: {
    borderRadius: 24,
    padding: 20,
  },
  portAmountText: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 50,
    marginBottom: 4,
  },
  portCurrencyText: {
    fontSize: 12,
    marginBottom: 4,
  },
  gainsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  gainBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeframesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  timePill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  timePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailsCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  kycHeroBanner: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  kycSahulatTag: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  kycDescText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 10,
  },
  kycTrackBg: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
  kycTrackFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  kycCardList: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  stepBadgeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 1,
  },
  stepDoneCheck: {
    fontSize: 12,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 13,
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 11,
  },
  scanCtaBtn: {
    marginTop: 10,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  scanCtaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  doneTagText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundSubhead: {
    fontSize: 11,
    marginBottom: 10,
    paddingLeft: 4,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  amountLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 50,
    fontWeight: '800',
    letterSpacing: -2,
  },
  yieldText: {
    fontSize: 11,
    marginTop: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  keyBtn: {
    width: '31%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    marginTop: 14,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
