import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { Logo } from '../../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: 1,
    icon: 'pie-chart',
    tag: 'WEALTH & LIABILITIES',
    title: 'Master Your Wealth & Liabilities',
    description:
      'Track net worth, income burn rate, bank accounts, credit cards, and auto loans in one unified real-time dashboard.',
    badgeText: 'PKR 5,740,000 Portfolio',
    badgeColor: '#00C853',
  },
  {
    id: 2,
    icon: 'trending-up',
    tag: 'REAL-TIME MARKETS',
    title: 'Live PSX & Crypto Markets',
    description:
      'Monitor live PSX stock tickers, KSE-100 index performance, crypto market dominance, and instant trade execution.',
    badgeText: 'PSX +0.84% · KSE 78,412 pts',
    badgeColor: '#0047AB',
  },
  {
    id: 3,
    icon: 'zap',
    tag: 'AI CA ADVISOR',
    title: 'Personal AI Financial Advisor',
    description:
      'Get automated Chartered Accountant advice to clear high-APR credit debt first and maximize annual interest savings.',
    badgeText: 'Save PKR 12,600/yr Interest',
    badgeColor: '#7C4DFF',
  },
];

export const OnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (activeIndex < ONBOARDING_DATA.length - 1) {
      const nextIdx = activeIndex + 1;
      scrollRef.current?.scrollTo({
        x: nextIdx * (SCREEN_WIDTH - 32),
        animated: true,
      });
      setActiveIndex(nextIdx);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BG }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.BG}
      />

      {/* Header */}
      <View
        style={[
          styles.headerRow,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <View style={styles.brandRow}>
          <Logo size={52} />
          <Text style={[styles.brandTitle, { color: theme.TEXT }]}>
            ezfinance
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSkip}
          style={[styles.skipBtn, { backgroundColor: theme.CARD }]}
        >
          <Text style={[styles.skipText, { color: theme.MUTED }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Horizontal Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: false,
            listener: (e: any) => {
              const slide = Math.round(
                e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32),
              );
              if (slide !== activeIndex && slide >= 0 && slide < 3) {
                setActiveIndex(slide);
              }
            },
          },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.slidesContainer}
      >
        {ONBOARDING_DATA.map((item, idx) => (
          <View
            key={item.id}
            style={[styles.slideCard, { width: SCREEN_WIDTH - 32 }]}
          >
            {/* Graphic Illustration Card */}
            <View
              style={[
                styles.illustrationCard,
                { backgroundColor: theme.HERO_BG },
              ]}
            >
              <View
                style={[
                  styles.iconGlowCircle,
                  { backgroundColor: `${item.badgeColor}22` },
                ]}
              >
                <Feather name={item.icon} size={64} color={item.badgeColor} />
              </View>

              {/* Floating Feature Metric Pill */}
              <View
                style={[
                  styles.floatingPill,
                  { backgroundColor: 'rgba(255,255,255,0.12)' },
                ]}
              >
                <View
                  style={[
                    styles.dotIndicator,
                    { backgroundColor: item.badgeColor },
                  ]}
                />
                <Text style={styles.floatingPillText}>{item.badgeText}</Text>
              </View>
            </View>

            {/* Text Information Section */}
            <View style={styles.textSection}>
              <Text style={[styles.stepTag, { color: theme.ACTIVE }]}>
                {item.tag}
              </Text>
              <Text style={[styles.stepTitle, { color: theme.TEXT }]}>
                {item.title}
              </Text>
              <Text style={[styles.stepDesc, { color: theme.MUTED }]}>
                {item.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Area */}
      <View
        style={[
          styles.footerArea,
          {
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_DATA.map((_, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.dotPill,
                  {
                    backgroundColor: isSelected
                      ? theme.TEXT
                      : theme.MODAL,
                    width: isSelected ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: theme.TEXT }]}
        >
          <Text style={[styles.nextBtnText, { color: theme.BG }]}>
            {activeIndex === ONBOARDING_DATA.length - 1
              ? 'Get Started →'
              : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  slidesContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  slideCard: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  illustrationCard: {
    height: 280,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 32,
  },
  iconGlowCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingPill: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  floatingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textSection: {
    paddingHorizontal: 8,
  },
  stepTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 34,
    marginBottom: 12,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  footerArea: {
    paddingHorizontal: 24,
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dotPill: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
