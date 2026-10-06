import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import {
  WealthView,
  WealthOverlay,
  WEALTH_CHART_DATA,
  KSE_DATA,
  MRAF_DATA,
  AMCS,
  FUNDS_LOW,
  FUNDS_MED,
  FUNDS_HIGH,
  ALL_FUNDS,
  QUIZ_QUESTIONS,
  SCORE_WEIGHTS,
  ACTIVE_POSITIONS,
  MARKET_FILTERS,
  FundItem,
} from '../../../constants/investmentData';

import { InvestmentComingSoon } from './investments/InvestmentComingSoon';
import { FadeInView } from '../../../components';
import {
  RiskSelectorSheet,
  FundCompareSheet,
  InvestKeypadSheet,
  ExecSuccessModal,
  BiometricSheet,
  VerifyPendingDialog,
} from './investments/WealthModals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── SVG Charts ───────────────────────────────────────────────────────────────

function SvgMiniLineChart({
  data,
  color,
  width = 110,
  height = 40,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - 4 - ((val - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={{ width, height, justifyContent: 'center' }}>
      <Svg width={width} height={height}>
        <Polyline fill="none" stroke={color} strokeWidth="1.8" points={points} />
      </Svg>
    </View>
  );
}

function SvgAreaChart({
  data,
  color,
  width = SCREEN_WIDTH - 64,
  height = 80,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - 6 - ((val - min) / range) * (height - 12);
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `0,${height} ` + points + ` ${width},${height}`;

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.28" />
            <Stop offset="1" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        <Path d={`M ${areaPoints} Z`} fill="url(#wealthGrad)" />
        <Polyline fill="none" stroke={color} strokeWidth="2.4" points={points} />
      </Svg>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

const InvestmentHub = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showToast } = useToast();

  // Navigation Stack
  const [viewStack, setViewStack] = useState<WealthView[]>(['dashboard']);
  const [overlay, setOverlay] = useState<WealthOverlay>(null);

  // Flow State
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([null, null, null]);
  const [quizStep, setQuizStep] = useState(0);
  const [riskScore, setRiskScore] = useState(50);
  const [riskSlider, setRiskSlider] = useState(5);
  const [selectedFundId, setSelectedFundId] = useState('mraf');
  const [selectedAmcId, setSelectedAmcId] = useState('almeezan');
  const [investAmount, setInvestAmount] = useState('50000');
  const [marketFilter, setMarketFilter] = useState('All Funds');

  // SECP Onboarding State
  const [cnicFront, setCnicFront] = useState(false);
  const [cnicBack, setCnicBack] = useState(false);
  const [iban, setIban] = useState('PK64 MEZN 0001 2345 6789 0101');
  const [ibanVerified, setIbanVerified] = useState(false);
  const [declarations, setDeclarations] = useState([false, false, false]);

  const view = viewStack[viewStack.length - 1];
  const isRoot = ['dashboard', 'marketplace', 'secp0'].includes(view);

  // Direction of the last in-hub navigation, used for the view transition
  const navDir = useRef<'forward' | 'back' | 'up'>('up');

  const nav = (v: WealthView) => {
    navDir.current = 'forward';
    setViewStack(s => [...s, v]);
  };
  const back = () => {
    navDir.current = 'back';
    setViewStack(s => {
      if (s.length > 1) {
        return s.slice(0, -1);
      }
      return ['dashboard'];
    });
  };
  const root = (v: WealthView) => {
    navDir.current = 'up';
    setViewStack([v]);
  };

  const selectedFund = ALL_FUNDS.find(f => f.id === selectedFundId) ?? ALL_FUNDS[0];
  const selectedAmc = AMCS.find(a => a.id === selectedAmcId) ?? AMCS[0];

  const VIEW_TITLES: Partial<Record<WealthView, string>> = {
    dashboard: 'Wealth Engine',
    marketplace: 'Marketplace',
    positions: 'Portfolio',
    riskQuiz: 'Risk Assessment',
    riskResult: 'Risk Profile',
    fundsLow: 'Low-Risk Funds',
    fundsMed: 'Medium-Risk Funds',
    fundsHigh: 'High-Risk Funds',
    fundDetail: 'Fund Factsheet',
    amcDetail: 'AMC Profile',
    orderReview: 'Order Review',
    secp0: 'SECP Onboarding',
    secp1: 'Identity Verification',
    secp2: 'IBAN Linking',
    secp3: 'Compliance',
    secp4: 'Account Active',
  };

  const handleQuizOption = (optIdx: number) => {
    setQuizAnswers(prev => {
      const nextArr = [...prev];
      nextArr[quizStep] = optIdx;
      return nextArr;
    });
  };

  const handleNextQuizStep = () => {
    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep(s => s + 1);
    } else {
      const score = quizAnswers.reduce<number>(
        (s, ans, i) => s + (ans !== null ? SCORE_WEIGHTS[i][ans] : 0),
        0,
      );
      setRiskScore(score);
      nav('riskResult');
    }
  };

  // Reusable Fund Card
  const renderFundCard = (fund: FundItem, miniData?: number[]) => {
    const yieldVal = fund.fiveYrReturn ?? fund.yieldPct;
    const yieldLabel = fund.fiveYrReturn ? '5-yr Return' : 'Ann. Yield';

    return (
      <TouchableOpacity
        key={fund.id}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedFundId(fund.id);
          nav('fundDetail');
        }}
        style={[
          styles.card,
          {
            backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
            borderColor: theme.BORDER,
          },
        ]}
      >
        <View style={styles.fundCardTop}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <View style={styles.badgesRow}>
              {fund.shariah && (
                <View style={[styles.badgePill, { backgroundColor: theme.GREEN + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.GREEN }]}>Shariah</Text>
                </View>
              )}
              {fund.sec62 && (
                <View style={[styles.badgePill, { backgroundColor: theme.ACTIVE + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.ACTIVE }]}>Sec 62</Text>
                </View>
              )}
              <View style={[styles.badgePill, { backgroundColor: theme.MODAL }]}>
                <Text style={[styles.badgeText, { color: theme.MUTED }]}>{fund.category}</Text>
              </View>
            </View>
            <Text style={[styles.fundName, { color: theme.TEXT }]}>{fund.name}</Text>
            <Text style={[styles.fundManager, { color: theme.MUTED }]}>{fund.manager}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.fundYield, { color: theme.GREEN }]}>+{yieldVal}%</Text>
            <Text style={[styles.fundYieldLabel, { color: theme.MUTED }]}>{yieldLabel}</Text>
          </View>
        </View>

        {miniData && (
          <View style={styles.miniChartWrap}>
            <SvgMiniLineChart
              data={miniData}
              color={theme.GREEN}
              width={SCREEN_WIDTH - 64}
              height={36}
            />
          </View>
        )}

        <View style={styles.fundMetricsRow}>
          <View style={[styles.metricCell, { backgroundColor: theme.MODAL }]}>
            <Text style={[styles.metricKey, { color: theme.MUTED }]}>NAV</Text>
            <Text style={[styles.metricVal, { color: theme.TEXT }]}>PKR {fund.nav.toFixed(2)}</Text>
          </View>
          <View style={[styles.metricCell, { backgroundColor: theme.MODAL }]}>
            <Text style={[styles.metricKey, { color: theme.MUTED }]}>EXIT LOAD</Text>
            <Text style={[styles.metricVal, { color: theme.TEXT }]}>{fund.exitLoad}</Text>
          </View>
          <View style={[styles.metricCell, { backgroundColor: theme.MODAL }]}>
            <Text style={[styles.metricKey, { color: theme.MUTED }]}>AUM</Text>
            <Text style={[styles.metricVal, { color: theme.TEXT }]}>{fund.aum}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        <FadeInView key={view} from={navDir.current} distance={28}>
        {/* Top Header */}
        <View style={styles.headerWrapper}>
          {view !== 'dashboard' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={back}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="chevron-left" size={16} color={theme.MUTED} />
              <Text style={[styles.backText, { color: theme.MUTED }]}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.TEXT, flex: 1 }]}>
              {VIEW_TITLES[view] ?? 'Wealth Engine'}
            </Text>

            {/* Quick Root Icons */}
            {isRoot && (
              <View style={styles.rootIconsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => root('dashboard')}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: view === 'dashboard' ? theme.TEXT : theme.CARD,
                    },
                  ]}
                >
                  <Feather
                    name="trending-up"
                    size={15}
                    color={view === 'dashboard' ? theme.BG : theme.MUTED}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (view !== 'marketplace') {
                      nav('marketplace');
                    }
                  }}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: view === 'marketplace' ? theme.TEXT : theme.CARD,
                    },
                  ]}
                >
                  <Feather
                    name="sliders"
                    size={15}
                    color={view === 'marketplace' ? theme.BG : theme.MUTED}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!view.startsWith('secp')) {
                      nav('secp0');
                    }
                  }}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: view.startsWith('secp') ? theme.TEXT : theme.CARD,
                    },
                  ]}
                >
                  <Feather
                    name="shield"
                    size={15}
                    color={view.startsWith('secp') ? theme.BG : theme.MUTED}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── 1. DASHBOARD VIEW ── */}
        {view === 'dashboard' && (
          <View style={{ gap: 14 }}>
            {/* Hero Portfolio Card */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              <Text style={[styles.heroPre, { color: theme.MUTED }]}>
                WEALTH ENGINE // PORTFOLIO
              </Text>
              <Text style={[styles.heroSub, { color: theme.MUTED }]}>
                Total Invested (PKR)
              </Text>
              <Text style={[styles.heroAmount, { color: theme.TEXT }]}>
                2,48,000
              </Text>
              <View style={styles.heroGainRow}>
                <Text style={[styles.gainText, { color: theme.GREEN }]}>
                  +32,400
                </Text>
                <View style={[styles.allTimeBadge, { backgroundColor: theme.GREEN + '20' }]}>
                  <Text style={[styles.allTimeText, { color: theme.GREEN }]}>
                    +14.8% All-Time
                  </Text>
                </View>
              </View>

              {/* Asset Distribution Segmented Bar */}
              <View style={{ marginBottom: 16 }}>
                <View style={styles.segmentBar}>
                  <View style={{ flex: 55, backgroundColor: theme.GREEN, borderRadius: 2 }} />
                  <View style={{ flex: 30, backgroundColor: theme.ACTIVE, borderRadius: 2 }} />
                  <View style={{ flex: 15, backgroundColor: '#FF9500', borderRadius: 2 }} />
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.GREEN }]} />
                    <Text style={[styles.legendText, { color: theme.MUTED }]}>Money Market 55%</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.ACTIVE }]} />
                    <Text style={[styles.legendText, { color: theme.MUTED }]}>Sukuk 30%</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
                    <Text style={[styles.legendText, { color: theme.MUTED }]}>Equity 15%</Text>
                  </View>
                </View>
              </View>

              {/* Area Chart */}
              <SvgAreaChart
                data={WEALTH_CHART_DATA}
                color={theme.ACTIVE}
                width={SCREEN_WIDTH - 64}
                height={80}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => nav('marketplace')}
                style={[styles.actionBtnPrimary, { backgroundColor: theme.TEXT }]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.primaryActionText, { color: theme.BG }]}
                >
                  + Explore Marketplace
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => nav('positions')}
                style={[
                  styles.actionBtnSecondary,
                  { borderColor: theme.BORDER, backgroundColor: 'transparent' },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.secondaryActionText, { color: theme.TEXT }]}
                >
                  View Holdings
                </Text>
              </TouchableOpacity>
            </View>

            {/* Summary Metrics Row */}
            <View style={styles.summaryRow}>
              {[
                { label: 'DAILY P&L', val: '+1,240', color: theme.GREEN },
                { label: 'MONTH GAIN', val: '+9,840', color: theme.GREEN },
                { label: 'CGT RATE', val: '15%', color: theme.RED },
              ].map(tile => (
                <View
                  key={tile.label}
                  style={[
                    styles.tileBox,
                    {
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.tileLabel, { color: theme.MUTED }]}>{tile.label}</Text>
                  <Text style={[styles.tileVal, { color: tile.color }]}>{tile.val}</Text>
                </View>
              ))}
            </View>

            {/* Quick Access Card - Risk Profile */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setQuizStep(0);
                setQuizAnswers([null, null, null]);
                nav('riskQuiz');
              }}
              style={[
                styles.quickAccessCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickAccessTitle, { color: theme.TEXT }]}>
                  Risk Profile Assessment
                </Text>
                <Text style={[styles.quickAccessSub, { color: theme.MUTED }]}>
                  3-question investor questionnaire
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={theme.MUTED} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── 2. MARKETPLACE VIEW ── */}
        {view === 'marketplace' && (
          <View style={{ gap: 14 }}>
            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {MARKET_FILTERS.map(f => (
                  <TouchableOpacity
                    key={f}
                    activeOpacity={0.8}
                    onPress={() => setMarketFilter(f)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: marketFilter === f ? theme.TEXT : theme.CARD,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        { color: marketFilter === f ? theme.BG : theme.MUTED },
                      ]}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Marketplace Stats */}
            <View style={styles.marketStatsRow}>
              <View
                style={[
                  styles.marketStatBox,
                  {
                    backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                    borderColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[styles.tileLabel, { color: theme.MUTED }]}>PORTFOLIO</Text>
                <Text style={[styles.marketStatVal, { color: theme.TEXT }]}>2,48,000</Text>
              </View>
              <View
                style={[
                  styles.marketStatBox,
                  {
                    backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                    borderColor: theme.BORDER,
                  },
                ]}
              >
                <Text style={[styles.tileLabel, { color: theme.MUTED }]}>DAY P&L</Text>
                <Text style={[styles.marketStatVal, { color: theme.GREEN }]}>+1,240</Text>
              </View>
            </View>

            {/* SECP AMCs List */}
            <Text style={[styles.sectionHeading, { color: theme.MUTED }]}>
              SECP-REGISTERED PARTNERS
            </Text>
            <View
              style={[
                styles.groupCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              {AMCS.filter(a => {
                if (marketFilter === 'Shariah') return a.type === 'Shariah';
                if (marketFilter === 'Conventional') return a.type === 'Conventional';
                return true;
              }).map((amc, i) => (
                <TouchableOpacity
                  key={amc.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedAmcId(amc.id);
                    nav('amcDetail');
                  }}
                  style={[
                    styles.amcRow,
                    i < AMCS.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={[styles.amcName, { color: theme.TEXT }]}>{amc.name}</Text>
                      <View style={[styles.ratingBadge, { backgroundColor: theme.MODAL }]}>
                        <Text style={[styles.ratingText, { color: theme.MUTED }]}>{amc.rating}</Text>
                      </View>
                    </View>
                    <Text style={[styles.amcMeta, { color: theme.MUTED }]}>
                      AUM PKR {amc.aum} · {amc.type}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.amcYtd, { color: theme.GREEN }]}>{amc.ytd}</Text>
                    <Feather name="chevron-right" size={13} color={theme.MUTED} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Browse by Risk Level */}
            <Text style={[styles.sectionHeading, { color: theme.MUTED }]}>
              BROWSE BY RISK LEVEL
            </Text>
            <View style={styles.riskBrowseRow}>
              {[
                { label: 'Low Risk', v: 'fundsLow' as WealthView, color: theme.GREEN, desc: 'Money Market' },
                { label: 'Med Risk', v: 'fundsMed' as WealthView, color: theme.ACTIVE, desc: 'Sukuk/Income' },
                { label: 'High Risk', v: 'fundsHigh' as WealthView, color: '#FF9500', desc: 'KSE Equity' },
              ].map(t => (
                <TouchableOpacity
                  key={t.label}
                  activeOpacity={0.85}
                  onPress={() => nav(t.v)}
                  style={[
                    styles.riskBrowseBox,
                    {
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.riskBrowseLabel, { color: t.color }]}>{t.label}</Text>
                  <Text style={[styles.riskBrowseDesc, { color: theme.MUTED }]}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── 3. POSITIONS / HOLDINGS VIEW ── */}
        {view === 'positions' && (
          <View style={{ gap: 14 }}>
            {/* Holdings Summary Card */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              <Text style={[styles.heroPre, { color: theme.MUTED }]}>ACTIVE HOLDINGS</Text>
              <Text style={[styles.heroAmount, { color: theme.TEXT, marginTop: 4 }]}>2,48,000</Text>
              <Text style={[styles.heroSub, { color: theme.MUTED, marginTop: 2 }]}>
                PKR · Total Portfolio Value
              </Text>
              <Text style={[styles.gainText, { color: theme.GREEN, marginTop: 6 }]}>
                +32,400 All-Time Gain
              </Text>
              <View style={{ marginTop: 12 }}>
                <SvgAreaChart
                  data={WEALTH_CHART_DATA}
                  color={theme.GREEN}
                  width={SCREEN_WIDTH - 64}
                  height={80}
                />
              </View>
            </View>

            {/* Position Cards */}
            {ACTIVE_POSITIONS.map(pos => {
              const currentVal = pos.units * pos.nav;
              const gainPct = (((pos.nav - pos.costNav) / pos.costNav) * 100).toFixed(1);

              return (
                <View
                  key={pos.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                    },
                  ]}
                >
                  <View style={styles.fundCardTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.fundName, { color: theme.TEXT }]}>{pos.name}</Text>
                      <Text style={[styles.fundManager, { color: theme.MUTED, marginTop: 2 }]}>
                        {pos.units.toLocaleString()} units @ NAV {pos.nav.toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.positionAmt, { color: theme.TEXT }]}>
                        PKR {Math.round(currentVal).toLocaleString()}
                      </Text>
                      <Text style={[styles.gainText, { color: theme.GREEN, fontSize: 11 }]}>
                        +{gainPct}%
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.fundMetricsRow, { marginVertical: 10 }]}>
                    <View style={[styles.metricCell, { backgroundColor: theme.MODAL }]}>
                      <Text style={[styles.metricKey, { color: theme.MUTED }]}>DAILY DIV.</Text>
                      <Text style={[styles.metricVal, { color: pos.dailyDiv > 0 ? theme.GREEN : theme.MUTED }]}>
                        {pos.dailyDiv > 0 ? `+PKR ${pos.dailyDiv.toFixed(2)}` : '—'}
                      </Text>
                    </View>
                    <View style={[styles.metricCell, { backgroundColor: theme.MODAL }]}>
                      <Text style={[styles.metricKey, { color: theme.MUTED }]}>ALL-TIME GAIN</Text>
                      <Text style={[styles.metricVal, { color: theme.GREEN }]}>
                        +{pos.allTimeGain.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => showToast('Liquidation request initiated with AMC', 'info')}
                    style={[
                      styles.encashBtn,
                      { borderColor: theme.RED + '40', backgroundColor: theme.RED + '10' },
                    ]}
                  >
                    <Text style={[styles.encashBtnText, { color: theme.RED }]}>
                      Instant Liquidation / Encashment
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ── 4. RISK QUIZ VIEW ── */}
        {view === 'riskQuiz' && (
          <View style={{ gap: 16 }}>
            {/* Progress Bar */}
            <View style={styles.quizProgressBar}>
              {QUIZ_QUESTIONS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.quizProgressSegment,
                    {
                      backgroundColor: i <= quizStep ? theme.ACTIVE : theme.MODAL,
                    },
                  ]}
                />
              ))}
            </View>

            <Text style={[styles.quizStepLabel, { color: theme.MUTED }]}>
              Question {quizStep + 1} of {QUIZ_QUESTIONS.length} · Risk Profile Assessment
            </Text>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                  padding: 20,
                },
              ]}
            >
              <Text style={[styles.quizQuestionText, { color: theme.TEXT }]}>
                {QUIZ_QUESTIONS[quizStep].q}
              </Text>
              <View style={{ gap: 10 }}>
                {QUIZ_QUESTIONS[quizStep].opts.map((opt, i) => {
                  const isSel = quizAnswers[quizStep] === i;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.8}
                      onPress={() => handleQuizOption(i)}
                      style={[
                        styles.quizOptionBtn,
                        {
                          borderColor: isSel ? theme.ACTIVE : theme.BORDER,
                          backgroundColor: isSel ? theme.ACTIVE + '18' : theme.MODAL,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quizOptionText,
                          {
                            color: isSel ? theme.ACTIVE : theme.TEXT,
                            fontWeight: isSel ? '700' : '500',
                          },
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              {quizStep > 0 && (
                <TouchableOpacity
                  onPress={() => setQuizStep(s => s - 1)}
                  style={[styles.quizPrevBtn, { backgroundColor: theme.MODAL }]}
                >
                  <Feather name="chevron-left" size={18} color={theme.TEXT} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={quizAnswers[quizStep] !== null ? 0.88 : 1}
                disabled={quizAnswers[quizStep] === null}
                onPress={handleNextQuizStep}
                style={[
                  styles.quizNextBtn,
                  {
                    backgroundColor:
                      quizAnswers[quizStep] !== null ? theme.TEXT : theme.MODAL,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.primaryActionText,
                    {
                      color:
                        quizAnswers[quizStep] !== null ? theme.BG : theme.MUTED,
                    },
                  ]}
                >
                  {quizStep < QUIZ_QUESTIONS.length - 1
                    ? 'Next Question →'
                    : 'View My Risk Score →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 5. RISK RESULT VIEW ── */}
        {view === 'riskResult' && (
          <View style={{ gap: 14 }}>
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                  alignItems: 'center',
                  paddingVertical: 28,
                },
              ]}
            >
              <Text style={[styles.heroPre, { color: theme.MUTED, marginBottom: 16 }]}>
                YOUR INVESTOR RISK SCORE
              </Text>
              <View
                style={[
                  styles.scoreCircle,
                  {
                    borderColor:
                      riskScore < 34
                        ? theme.GREEN
                        : riskScore < 67
                        ? theme.ACTIVE
                        : '#FF9500',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.scoreNum,
                    {
                      color:
                        riskScore < 34
                          ? theme.GREEN
                          : riskScore < 67
                          ? theme.ACTIVE
                          : '#FF9500',
                    },
                  ]}
                >
                  {riskScore}
                </Text>
                <Text style={{ fontSize: 10, color: theme.MUTED }}>/ 100</Text>
              </View>
              <Text
                style={[
                  styles.scoreLabel,
                  {
                    color:
                      riskScore < 34
                        ? theme.GREEN
                        : riskScore < 67
                        ? theme.ACTIVE
                        : '#FF9500',
                  },
                ]}
              >
                {riskScore < 34
                  ? 'CONSERVATIVE'
                  : riskScore < 67
                  ? 'MODERATE CONSERVATIVE'
                  : 'AGGRESSIVE GROWTH'}
              </Text>
              <Text style={[styles.scoreDesc, { color: theme.MUTED }]}>
                Based on your investment objectives, horizon, and market response preferences.
              </Text>
            </View>

            {/* Recommended Allocation Model */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                  padding: 16,
                },
              ]}
            >
              <Text style={[styles.sectionHeading, { color: theme.MUTED, marginBottom: 12 }]}>
                RECOMMENDED ALLOCATION MODEL
              </Text>
              <View style={[styles.segmentBar, { marginBottom: 14 }]}>
                {riskScore < 34 ? (
                  <>
                    <View style={{ flex: 85, backgroundColor: theme.GREEN, borderRadius: 2 }} />
                    <View style={{ flex: 15, backgroundColor: theme.ACTIVE, borderRadius: 2 }} />
                  </>
                ) : riskScore < 67 ? (
                  <>
                    <View style={{ flex: 70, backgroundColor: theme.GREEN, borderRadius: 2 }} />
                    <View style={{ flex: 20, backgroundColor: theme.ACTIVE, borderRadius: 2 }} />
                    <View style={{ flex: 10, backgroundColor: '#FF9500', borderRadius: 2 }} />
                  </>
                ) : (
                  <>
                    <View style={{ flex: 20, backgroundColor: theme.GREEN, borderRadius: 2 }} />
                    <View style={{ flex: 30, backgroundColor: theme.ACTIVE, borderRadius: 2 }} />
                    <View style={{ flex: 50, backgroundColor: '#FF9500', borderRadius: 2 }} />
                  </>
                )}
              </View>

              <View style={{ gap: 8 }}>
                <View style={styles.allocRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.legendDot, { backgroundColor: theme.GREEN }]} />
                    <Text style={[styles.allocLabel, { color: theme.TEXT }]}>Low-Risk Money Market</Text>
                  </View>
                  <Text style={[styles.allocPct, { color: theme.GREEN }]}>
                    {riskScore < 34 ? '85%' : riskScore < 67 ? '70%' : '20%'}
                  </Text>
                </View>

                <View style={styles.allocRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.legendDot, { backgroundColor: theme.ACTIVE }]} />
                    <Text style={[styles.allocLabel, { color: theme.TEXT }]}>Medium-Risk Sukuk</Text>
                  </View>
                  <Text style={[styles.allocPct, { color: theme.ACTIVE }]}>
                    {riskScore < 34 ? '15%' : riskScore < 67 ? '20%' : '30%'}
                  </Text>
                </View>

                {riskScore >= 34 && (
                  <View style={styles.allocRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
                      <Text style={[styles.allocLabel, { color: theme.TEXT }]}>High-Risk Equity</Text>
                    </View>
                    <Text style={[styles.allocPct, { color: '#FF9500' }]}>
                      {riskScore < 67 ? '10%' : '50%'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => nav(riskScore < 34 ? 'fundsLow' : riskScore < 67 ? 'fundsMed' : 'fundsHigh')}
              style={[styles.primaryActionBtn, { backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.primaryActionText, { color: theme.BG }]}>
                View Recommended Funds →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 6. LOW RISK FUNDS VIEW ── */}
        {view === 'fundsLow' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.tierHeaderBanner, { backgroundColor: theme.CARD }]}>
              <View style={[styles.legendDot, { backgroundColor: theme.GREEN, width: 8, height: 8 }]} />
              <View>
                <Text style={[styles.tierBannerTitle, { color: theme.GREEN }]}>
                  CAPITAL PRESERVATION
                </Text>
                <Text style={{ fontSize: 11, color: theme.MUTED, marginTop: 1 }}>
                  Money Market & Sovereign Treasury · Daily Liquidity
                </Text>
              </View>
            </View>
            {FUNDS_LOW.map(f => renderFundCard(f, MRAF_DATA))}
          </View>
        )}

        {/* ── 7. MED RISK FUNDS VIEW ── */}
        {view === 'fundsMed' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.tierHeaderBanner, { backgroundColor: theme.CARD }]}>
              <View style={[styles.legendDot, { backgroundColor: theme.ACTIVE, width: 8, height: 8 }]} />
              <View>
                <Text style={[styles.tierBannerTitle, { color: theme.ACTIVE }]}>
                  BALANCED INCOME
                </Text>
                <Text style={{ fontSize: 11, color: theme.MUTED, marginTop: 1 }}>
                  Sovereign Sukuk & Corporate Debt · 1-3 Year Tenure
                </Text>
              </View>
            </View>
            {FUNDS_MED.map(f => renderFundCard(f))}
          </View>
        )}

        {/* ── 8. HIGH RISK FUNDS VIEW ── */}
        {view === 'fundsHigh' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.tierHeaderBanner, { backgroundColor: theme.CARD }]}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500', width: 8, height: 8 }]} />
              <View>
                <Text style={[styles.tierBannerTitle, { color: '#FF9500' }]}>
                  CAPITAL APPRECIATION
                </Text>
                <Text style={{ fontSize: 11, color: theme.MUTED, marginTop: 1 }}>
                  PSX KSE-100 Equity Trackers · High Volatility
                </Text>
              </View>
            </View>
            {FUNDS_HIGH.map(f => renderFundCard(f, KSE_DATA))}
          </View>
        )}

        {/* ── 9. FUND DETAIL VIEW ── */}
        {view === 'fundDetail' && (
          <View style={{ gap: 14 }}>
            {/* Factsheet Hero */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                  padding: 20,
                },
              ]}
            >
              <View style={styles.badgesRow}>
                {selectedFund.shariah && (
                  <View style={[styles.badgePill, { backgroundColor: theme.GREEN + '20' }]}>
                    <Text style={[styles.badgeText, { color: theme.GREEN }]}>Shariah Compliant</Text>
                  </View>
                )}
                {selectedFund.sec62 && (
                  <View style={[styles.badgePill, { backgroundColor: theme.ACTIVE + '20' }]}>
                    <Text style={[styles.badgeText, { color: theme.ACTIVE }]}>FBR Section 62</Text>
                  </View>
                )}
                <View style={[styles.badgePill, { backgroundColor: theme.MODAL }]}>
                  <Text style={[styles.badgeText, { color: theme.MUTED }]}>{selectedFund.category}</Text>
                </View>
              </View>
              <Text style={[styles.detailTitle, { color: theme.TEXT }]}>{selectedFund.name}</Text>
              <Text style={[styles.fundManager, { color: theme.MUTED, marginBottom: 14 }]}>
                {selectedFund.manager}
              </Text>

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View>
                  <Text style={[styles.metricKey, { color: theme.MUTED }]}>ANNL. YIELD</Text>
                  <Text style={[styles.detailYield, { color: theme.GREEN }]}>
                    +{selectedFund.yieldPct ?? selectedFund.fiveYrReturn}%
                  </Text>
                </View>
                {selectedFund.fiveYrReturn && (
                  <View style={{ borderLeftWidth: 1, borderLeftColor: theme.BORDER, paddingLeft: 16 }}>
                    <Text style={[styles.metricKey, { color: theme.MUTED }]}>5-YEAR RETURN</Text>
                    <Text style={[styles.detailYield, { color: theme.GREEN }]}>
                      +{selectedFund.fiveYrReturn}%
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Factsheet Rows */}
            <View
              style={[
                styles.groupCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              {[
                { label: 'Net Asset Value (NAV)', val: `PKR ${selectedFund.nav.toFixed(4)}` },
                { label: 'Fund Size (AUM)', val: selectedFund.aum },
                { label: 'Management Fee', val: selectedFund.mgmtFee },
                { label: 'Exit Load', val: selectedFund.exitLoad },
                { label: 'Min. Investment', val: `PKR ${selectedFund.minInvest}` },
                { label: 'Shariah Advisor', val: selectedFund.shariadvisor || 'N/A' },
                {
                  label: 'Section 62 Eligible',
                  val: selectedFund.sec62 ? 'YES — FBR/SECP Verified' : 'No',
                  color: selectedFund.sec62 ? theme.GREEN : theme.MUTED,
                },
              ].map((r, i) => (
                <View
                  key={r.label}
                  style={[
                    styles.tableRow,
                    i < 6 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.tableLabel, { color: theme.MUTED }]}>{r.label}</Text>
                  <Text style={[styles.tableValue, { color: r.color || theme.TEXT }]}>{r.val}</Text>
                </View>
              ))}
            </View>

            {/* Top Holdings for Equity */}
            {selectedFund.holdings && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                    borderColor: theme.BORDER,
                    padding: 16,
                  },
                ]}
              >
                <Text style={[styles.sectionHeading, { color: theme.MUTED, marginBottom: 10 }]}>
                  TOP HOLDINGS
                </Text>
                {selectedFund.holdings.map(h => (
                  <View key={h} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={[styles.legendDot, { backgroundColor: theme.MUTED }]} />
                    <Text style={{ fontSize: 12, color: theme.TEXT }}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions: Compare & Invest */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOverlay('fundCompare')}
                style={[
                  styles.squareBtn,
                  {
                    backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                    borderColor: theme.BORDER,
                  },
                ]}
              >
                <Feather name="layers" size={18} color={theme.MUTED} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => nav('orderReview')}
                style={[styles.primaryActionBtn, { flex: 1, backgroundColor: theme.TEXT }]}
              >
                <Text style={[styles.primaryActionText, { color: theme.BG }]}>
                  Invest in This Fund →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 10. AMC DETAIL VIEW ── */}
        {view === 'amcDetail' && (
          <View style={{ gap: 14 }}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                  padding: 20,
                },
              ]}
            >
              <View style={styles.badgesRow}>
                <View style={[styles.badgePill, { backgroundColor: theme.ACTIVE + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.ACTIVE }]}>{selectedAmc.rating}</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: theme.MODAL }]}>
                  <Text style={[styles.badgeText, { color: theme.MUTED }]}>{selectedAmc.type}</Text>
                </View>
              </View>
              <Text style={[styles.detailTitle, { color: theme.TEXT }]}>{selectedAmc.name}</Text>
              <Text style={[styles.gainText, { color: theme.GREEN, marginTop: 4 }]}>
                YTD {selectedAmc.ytd}
              </Text>
            </View>

            <View
              style={[
                styles.groupCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              {[
                { label: 'SECP Rating', val: selectedAmc.rating },
                { label: 'Total AUM', val: `PKR ${selectedAmc.aum}` },
                { label: 'Licensed Since', val: selectedAmc.since },
                { label: 'Fund Type', val: selectedAmc.type },
                { label: 'Active Funds', val: `${selectedAmc.funds} Products` },
                { label: 'Custodian Bank', val: selectedAmc.custodian },
                { label: 'Regulator', val: 'SECP Pakistan' },
              ].map((r, i) => (
                <View
                  key={r.label}
                  style={[
                    styles.tableRow,
                    i < 6 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.tableLabel, { color: theme.MUTED }]}>{r.label}</Text>
                  <Text style={[styles.tableValue, { color: theme.TEXT }]}>{r.val}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── 11. ORDER REVIEW VIEW ── */}
        {view === 'orderReview' && (
          <View style={{ gap: 14 }}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                  padding: 20,
                },
              ]}
            >
              <Text style={[styles.heroPre, { color: theme.MUTED, marginBottom: 8 }]}>
                INVESTMENT ORDER REVIEW
              </Text>
              <Text style={[styles.heroAmount, { color: theme.TEXT }]}>
                {parseInt(investAmount || '0', 10).toLocaleString()}
              </Text>
              <Text style={[styles.fundManager, { color: theme.MUTED, marginTop: 2, marginBottom: 12 }]}>
                PKR · {selectedFund.name}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.badgePill, { backgroundColor: theme.GREEN + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.GREEN }]}>
                    {(parseInt(investAmount || '0', 10) / selectedFund.nav).toFixed(2)} units
                  </Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: theme.ACTIVE + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.ACTIVE }]}>
                    NAV {selectedFund.nav.toFixed(4)}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.groupCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              {[
                { label: 'Selected Fund', val: selectedFund.name },
                {
                  label: 'Investment Amount',
                  val: `PKR ${parseInt(investAmount || '0', 10).toLocaleString()}`,
                },
                {
                  label: 'Units to Allocate',
                  val: `${(parseInt(investAmount || '0', 10) / selectedFund.nav).toFixed(2)} units`,
                },
                { label: 'Payment Source', val: 'Meezan Bank Checking (*1234)' },
                {
                  label: 'Sales Load',
                  val: 'PKR 0.00 (Zero Load Promotion)',
                  color: theme.GREEN,
                },
                {
                  label: 'Est. Annual Yield',
                  val: `+PKR ${Math.round(
                    (parseInt(investAmount || '0', 10) *
                      (selectedFund.yieldPct ?? 12.8)) /
                      100,
                  ).toLocaleString()} / year`,
                  color: theme.GREEN,
                },
              ].map((r, i) => (
                <View
                  key={r.label}
                  style={[
                    styles.tableRow,
                    i < 5 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.tableLabel, { color: theme.MUTED }]}>{r.label}</Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tableValue,
                      { color: r.color || theme.TEXT, maxWidth: 170 },
                    ]}
                  >
                    {r.val}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOverlay('investKeypad')}
                style={[
                  styles.squareBtn,
                  {
                    backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                    borderColor: theme.BORDER,
                  },
                ]}
              >
                <Feather name="plus" size={18} color={theme.MUTED} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setOverlay('execSuccess')}
                style={[styles.primaryActionBtn, { flex: 1, backgroundColor: theme.TEXT }]}
              >
                <Text style={[styles.primaryActionText, { color: theme.BG }]}>
                  Confirm & Execute →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 12. SECP 0: OVERVIEW ── */}
        {view === 'secp0' && (
          <View style={{ gap: 14 }}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                  padding: 22,
                },
              ]}
            >
              <Text style={[styles.heroPre, { color: theme.ACTIVE, marginBottom: 8 }]}>
                SECP SIMPLIFIED DIGITAL ONBOARDING
              </Text>
              <Text style={[styles.detailTitle, { color: theme.TEXT, marginBottom: 8 }]}>
                Open Your Sahulat Investor Account
              </Text>
              <Text style={{ fontSize: 12, color: theme.MUTED, lineHeight: 18, marginBottom: 16 }}>
                Paperless SECP verification in under 2 minutes. Investment ceiling up to PKR 3,000,000 for Sahulat accounts.
              </Text>

              <View style={[styles.capRow, { backgroundColor: theme.MODAL }]}>
                <Text style={{ fontSize: 11, color: theme.MUTED }}>Max Investment Cap</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: theme.TEXT }}>
                  PKR 30,00,000
                </Text>
              </View>
            </View>

            {/* 3 Step Sequence */}
            {[
              { n: '1', label: 'Identity Verification', desc: 'CNIC upload + NADRA Verisys' },
              { n: '2', label: 'Bank Account Link', desc: '1Link IBAN verification' },
              { n: '3', label: 'Biometric Match', desc: 'Live face detection vs NADRA DB' },
            ].map((st, i) => (
              <View key={st.n} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={[styles.stepNumberCircle, { backgroundColor: theme.MODAL }]}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.ACTIVE }}>
                    {st.n}
                  </Text>
                </View>
                <View
                  style={[
                    styles.card,
                    {
                      flex: 1,
                      backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                      borderColor: theme.BORDER,
                      padding: 14,
                    },
                  ]}
                >
                  <Text style={[styles.stepItemTitle, { color: theme.TEXT }]}>{st.label}</Text>
                  <Text style={{ fontSize: 11, color: theme.MUTED }}>{st.desc}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => nav('secp1')}
              style={[styles.primaryActionBtn, { backgroundColor: theme.TEXT, marginTop: 6 }]}
            >
              <Text style={[styles.primaryActionText, { color: theme.BG }]}>
                Begin Verification →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={back}
              style={[
                styles.secondaryActionBtn,
                { borderColor: theme.BORDER, backgroundColor: 'transparent', marginTop: 8 },
              ]}
            >
              <Text style={[styles.secondaryActionText, { color: theme.MUTED }]}>
                Return to Wealth Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 13. SECP 1: CNIC UPLOAD & BIOMETRIC ── */}
        {view === 'secp1' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, { backgroundColor: theme.CARD, padding: 16 }]}>
              <Text style={[styles.heroPre, { color: theme.MUTED, marginBottom: 2 }]}>
                STEP 1 OF 3
              </Text>
              <Text style={[styles.detailTitle, { color: theme.TEXT }]}>
                CNIC Document Capture
              </Text>
            </View>

            {/* Front & Back Upload Slots */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCnicFront(v => !v)}
              style={[
                styles.uploadBox,
                {
                  borderColor: cnicFront ? theme.GREEN : theme.MUTED + '44',
                  backgroundColor: theme.CARD,
                },
              ]}
            >
              <Feather
                name={cnicFront ? 'check-circle' : 'file-text'}
                size={28}
                color={cnicFront ? theme.GREEN : theme.MUTED}
              />
              <Text
                style={[
                  styles.uploadBoxText,
                  { color: cnicFront ? theme.GREEN : theme.TEXT },
                ]}
              >
                {cnicFront ? 'CNIC Front Uploaded ✓' : 'CNIC Front (Photo & Identity Data)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCnicBack(v => !v)}
              style={[
                styles.uploadBox,
                {
                  borderColor: cnicBack ? theme.GREEN : theme.MUTED + '44',
                  backgroundColor: theme.CARD,
                },
              ]}
            >
              <Feather
                name={cnicBack ? 'check-circle' : 'file-text'}
                size={28}
                color={cnicBack ? theme.GREEN : theme.MUTED}
              />
              <Text
                style={[
                  styles.uploadBoxText,
                  { color: cnicBack ? theme.GREEN : theme.TEXT },
                ]}
              >
                {cnicBack ? 'CNIC Back Uploaded ✓' : 'CNIC Back (Address & Family Tree Code)'}
              </Text>
            </TouchableOpacity>

            {/* NADRA Verified Banner */}
            {cnicFront && cnicBack && (
              <View style={[styles.nadraBanner, { backgroundColor: theme.GREEN + '16' }]}>
                <Feather name="user-check" size={20} color={theme.GREEN} />
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.GREEN }}>
                    NADRA Verisys Record Match
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.TEXT }}>
                    SHAHRUKH PALIJO · Verified ✓
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setOverlay('biometric')}
              style={[styles.secondaryActionBtn, { backgroundColor: theme.MODAL, borderColor: 'transparent' }]}
            >
              <Text style={[styles.secondaryActionText, { color: theme.TEXT }]}>
                Complete Biometric Verification
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={back}
                style={[
                  styles.actionBtnSecondary,
                  { borderColor: theme.BORDER, backgroundColor: 'transparent' },
                ]}
              >
                <Text style={[styles.secondaryActionText, { color: theme.MUTED }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={cnicFront && cnicBack ? 0.88 : 1}
                disabled={!cnicFront || !cnicBack}
                onPress={() => nav('secp2')}
                style={[
                  styles.actionBtnPrimary,
                  {
                    backgroundColor:
                      cnicFront && cnicBack ? theme.TEXT : theme.MODAL,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.primaryActionText,
                    {
                      color:
                        cnicFront && cnicBack ? theme.BG : theme.MUTED,
                    },
                  ]}
                >
                  Continue →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 14. SECP 2: IBAN LINKING ── */}
        {view === 'secp2' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, { backgroundColor: theme.CARD, padding: 16 }]}>
              <Text style={[styles.heroPre, { color: theme.MUTED, marginBottom: 2 }]}>
                STEP 2 OF 3
              </Text>
              <Text style={[styles.detailTitle, { color: theme.TEXT }]}>
                Bank Account IBAN Linking
              </Text>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                  padding: 16,
                },
              ]}
            >
              <Text style={[styles.tileLabel, { color: theme.MUTED, marginBottom: 6 }]}>
                BANK NAME
              </Text>
              <View style={[styles.ibanBox, { backgroundColor: theme.MODAL, marginBottom: 14 }]}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.TEXT }}>
                  Meezan Bank Limited
                </Text>
              </View>

              <Text style={[styles.tileLabel, { color: theme.MUTED, marginBottom: 6 }]}>
                IBAN
              </Text>
              <View style={[styles.ibanBox, { backgroundColor: theme.MODAL, marginBottom: 14 }]}>
                <TextInput
                  value={iban}
                  onChangeText={setIban}
                  style={{ fontSize: 12, fontFamily: 'monospace', color: theme.TEXT, padding: 0 }}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIbanVerified(true)}
                style={[styles.primaryActionBtn, { backgroundColor: theme.ACTIVE, height: 44 }]}
              >
                <Text style={[styles.primaryActionText, { color: '#FFFFFF', fontSize: 12 }]}>
                  Verify via 1Link
                </Text>
              </TouchableOpacity>
            </View>

            {ibanVerified && (
              <View style={[styles.nadraBanner, { backgroundColor: theme.GREEN + '16' }]}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.GREEN, marginBottom: 2 }}>
                    Title Matches CNIC Exactly · 1Link Verified ✓
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.TEXT }}>
                    SHAHRUKH PALIJO
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.MUTED, marginTop: 4 }}>
                    Dividend payouts and encashment proceeds will route strictly to this verified IBAN.
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={back}
                style={[
                  styles.actionBtnSecondary,
                  { borderColor: theme.BORDER, backgroundColor: 'transparent' },
                ]}
              >
                <Text style={[styles.secondaryActionText, { color: theme.MUTED }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={ibanVerified ? 0.88 : 1}
                disabled={!ibanVerified}
                onPress={() => nav('secp3')}
                style={[
                  styles.actionBtnPrimary,
                  {
                    backgroundColor: ibanVerified ? theme.TEXT : theme.MODAL,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.primaryActionText,
                    { color: ibanVerified ? theme.BG : theme.MUTED },
                  ]}
                >
                  Continue →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 15. SECP 3: COMPLIANCE DECLARATION ── */}
        {view === 'secp3' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, { backgroundColor: theme.CARD, padding: 16 }]}>
              <Text style={[styles.heroPre, { color: theme.MUTED, marginBottom: 2 }]}>
                STEP 3 OF 3
              </Text>
              <Text style={[styles.detailTitle, { color: theme.TEXT }]}>
                Compliance Declaration
              </Text>
            </View>

            <View
              style={[
                styles.groupCard,
                {
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              {[
                'I declare that the funds invested are from legitimate, legal sources.',
                'I acknowledge the maximum investment cap of PKR 3,000,000 for Sahulat Accounts.',
                'I am a tax resident of Pakistan and not a US Person (FATCA / CRS Compliance).',
              ].map((decl, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => {
                    setDeclarations(prev => {
                      const nextArr = [...prev];
                      nextArr[i] = !nextArr[i];
                      return nextArr;
                    });
                  }}
                  style={[
                    styles.declRow,
                    i < 2 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: declarations[i] ? theme.GREEN : 'transparent',
                        borderColor: declarations[i] ? theme.GREEN : theme.MUTED + '60',
                      },
                    ]}
                  >
                    {declarations[i] && <Feather name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <Text
                    style={[
                      styles.declText,
                      { color: declarations[i] ? theme.TEXT : theme.MUTED },
                    ]}
                  >
                    {decl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={back}
                style={[
                  styles.actionBtnSecondary,
                  { borderColor: theme.BORDER, backgroundColor: 'transparent' },
                ]}
              >
                <Text style={[styles.secondaryActionText, { color: theme.MUTED }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={declarations.every(Boolean) ? 0.88 : 1}
                disabled={!declarations.every(Boolean)}
                onPress={() => setOverlay('verifyPending')}
                style={[
                  styles.actionBtnPrimary,
                  {
                    backgroundColor: declarations.every(Boolean) ? theme.TEXT : theme.MODAL,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.primaryActionText,
                    { color: declarations.every(Boolean) ? theme.BG : theme.MUTED },
                  ]}
                >
                  Submit →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 16. SECP 4: ACCOUNT ACTIVE ── */}
        {view === 'secp4' && (
          <View style={{ gap: 16, alignItems: 'center' }}>
            <View style={[styles.activeCheckCircle, { backgroundColor: theme.GREEN + '20' }]}>
              <Feather name="check-circle" size={44} color={theme.GREEN} />
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.heroPre, { color: theme.GREEN, marginBottom: 6 }]}>
                SECP SAHULAT ACCOUNT ACTIVE
              </Text>
              <Text style={[styles.detailTitle, { color: theme.TEXT, textAlign: 'center' }]}>
                You're Verified & Ready to Invest
              </Text>
              <Text style={{ fontSize: 12, color: theme.MUTED, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                Your SECP-regulated account is fully provisioned and ready for capital deployment.
              </Text>
            </View>

            <View
              style={[
                styles.groupCard,
                {
                  width: '100%',
                  backgroundColor: theme.isDark ? theme.CARD : '#FFFFFF',
                  borderColor: theme.BORDER,
                },
              ]}
            >
              {[
                { label: 'Unique Investor ID', val: 'UIN-PK-849201' },
                { label: 'CDC Sub-Account', val: 'CDC-0492-881920' },
                { label: 'Max Investment Cap', val: 'PKR 30,00,000' },
                { label: 'Account Type', val: 'SECP Sahulat Account' },
                { label: 'KYC Status', val: 'Fully Verified ✓' },
              ].map((r, i) => (
                <View
                  key={r.label}
                  style={[
                    styles.tableRow,
                    i < 4 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.tableLabel, { color: theme.MUTED }]}>{r.label}</Text>
                  <Text style={[styles.tableValue, { color: theme.TEXT, fontFamily: 'monospace' }]}>
                    {r.val}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => root('marketplace')}
              style={[styles.primaryActionBtn, { width: '100%', backgroundColor: theme.TEXT }]}
            >
              <Text style={[styles.primaryActionText, { color: theme.BG }]}>
                Proceed to Deploy Capital in Marketplace →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => root('dashboard')}
              style={[
                styles.secondaryActionBtn,
                { width: '100%', borderColor: theme.BORDER, backgroundColor: 'transparent', marginTop: 8 },
              ]}
            >
              <Text style={[styles.secondaryActionText, { color: theme.MUTED }]}>
                Return to Wealth Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        )}
        </FadeInView>
      </ScrollView>

      {/* ── OVERLAYS ── */}

      {/* Risk Selector */}
      <RiskSelectorSheet
        visible={overlay === 'riskSelector'}
        value={riskSlider}
        onChange={setRiskSlider}
        onClose={() => setOverlay(null)}
      />

      {/* Fund Comparison */}
      <FundCompareSheet
        visible={overlay === 'fundCompare'}
        fund1Id={selectedFundId}
        onClose={() => setOverlay(null)}
      />

      {/* Invest Keypad */}
      <InvestKeypadSheet
        visible={overlay === 'investKeypad'}
        fund={selectedFund}
        onClose={() => setOverlay(null)}
        onConfirm={amt => {
          setInvestAmount(amt);
          setOverlay(null);
        }}
      />

      {/* Order Execution Success */}
      <ExecSuccessModal
        visible={overlay === 'execSuccess'}
        fundName={selectedFund.name}
        units={(parseInt(investAmount || '0', 10) / selectedFund.nav).toFixed(2)}
        amount={investAmount}
        onClose={() => {
          setOverlay(null);
          navDir.current = 'forward';
          setViewStack(['dashboard', 'positions']);
        }}
      />

      {/* Biometric Scan */}
      <BiometricSheet
        visible={overlay === 'biometric'}
        onClose={() => setOverlay(null)}
        onComplete={() => setOverlay(null)}
      />

      {/* Verify Pending */}
      <VerifyPendingDialog
        visible={overlay === 'verifyPending'}
        onClose={() => {
          setOverlay(null);
          nav('secp4');
        }}
      />
    </View>
  );
};

// Shows the "Coming Soon" splash first; resets every time the tab is left,
// so returning to Investments always lands on the splash again.
export const InvestmentsScreen = () => {
  const [revealed, setRevealed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => setRevealed(false);
    }, []),
  );

  return revealed ? (
    <FadeInView style={{ flex: 1 }} duration={380}>
      <InvestmentHub />
    </FadeInView>
  ) : (
    <InvestmentComingSoon onExplore={() => setRevealed(true)} />
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
  headerWrapper: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  rootIconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    padding: 20,
  },
  heroPre: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroSub: {
    fontSize: 10,
    marginTop: 8,
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  heroGainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  gainText: {
    fontSize: 13,
    fontWeight: '700',
  },
  allTimeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
  },
  allTimeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  segmentBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    height: 50,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryActionBtn: {
    height: 50,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    height: 50,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tileBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
  },
  tileLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  tileVal: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  quickAccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  quickAccessTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickAccessSub: {
    fontSize: 11,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  marketStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  marketStatBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
  },
  marketStatVal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  groupCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  amcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  amcName: {
    fontSize: 13,
    fontWeight: '700',
  },
  ratingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '700',
  },
  amcMeta: {
    fontSize: 10,
  },
  amcYtd: {
    fontSize: 13,
    fontWeight: '800',
  },
  riskBrowseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  riskBrowseBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  riskBrowseLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
  },
  riskBrowseDesc: {
    fontSize: 9,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
  },
  positionAmt: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  encashBtn: {
    height: 38,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  encashBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quizProgressBar: {
    flexDirection: 'row',
    gap: 6,
  },
  quizProgressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  quizStepLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  quizQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 18,
  },
  quizOptionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  quizOptionText: {
    fontSize: 13,
  },
  quizPrevBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizNextBtn: {
    flex: 1,
    height: 50,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  scoreNum: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 38,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  scoreDesc: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocLabel: {
    fontSize: 12,
  },
  allocPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  tierHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tierBannerTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  fundCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  fundName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fundManager: {
    fontSize: 10,
    marginTop: 2,
  },
  fundYield: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  fundYieldLabel: {
    fontSize: 9,
  },
  miniChartWrap: {
    marginVertical: 10,
    alignItems: 'center',
  },
  fundMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metricCell: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
  },
  metricKey: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  detailYield: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableLabel: {
    fontSize: 11,
  },
  tableValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  squareBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stepNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  uploadBox: {
    height: 100,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBoxText: {
    fontSize: 11,
    fontWeight: '600',
  },
  nadraBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
  },
  ibanBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  declRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  declText: {
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },
  activeCheckCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});
