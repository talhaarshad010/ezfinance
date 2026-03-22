import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Button, Logo, PaginationDots } from '../../../components';
import { colors } from '../../../theme/colors';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: 1,
    title: 'Financial Clarity',
    description: 'Experience financial clarity through organic minimalism and professional-grade analytics.',
    icon: 'target',
    accent: '#000',
  },
  {
    id: 2,
    title: 'Smart Portfolio',
    description: 'Track your investments across stocks and crypto with AI-powered trend analysis.',
    icon: 'trending-up',
    accent: '#0047AB',
  },
  {
    id: 3,
    title: 'AI Insights',
    description: 'Get predictive insights and portfolio balancing strategies tailored to your goals.',
    icon: 'zap',
    accent: '#000',
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < ONBOARDING_DATA.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const currentStep = ONBOARDING_DATA[activeIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Logo size={32} />
          <Typography variant="h2" weight="700" style={styles.logoText}>
            EZFinance
          </Typography>
        </View>
        <TouchableOpacity onPress={handleSkip}>
          <Typography variant="body" weight="600" color="#666">
            Skip
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          {/* Mock Illustration / Graphic */}
          <View style={[styles.illustrationCircle, { backgroundColor: currentStep.accent + '10' }]}>
            <Feather name={currentStep.icon} size={80} color={currentStep.accent} />
          </View>
          
          {/* Decorative elements representing "Data" */}
          <View style={styles.decorativeBars}>
            <View style={[styles.bar, { width: 100, backgroundColor: currentStep.accent }]} />
            <View style={[styles.bar, { width: 150, backgroundColor: '#EEE', marginTop: 8 }]} />
            <View style={[styles.bar, { width: 80, backgroundColor: '#EEE', marginTop: 8 }]} />
          </View>
        </View>

        <View style={styles.textSection}>
          <Typography variant="h1" weight="700" style={styles.title}>
            {currentStep.title}
          </Typography>
          <Typography variant="body" color="#666" style={styles.description}>
            {currentStep.description}
          </Typography>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <PaginationDots total={ONBOARDING_DATA.length} activeIndex={activeIndex} />
        
        <Button 
          title={activeIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next"} 
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    marginLeft: 8,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  illustrationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  decorativeBars: {
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  textSection: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    marginBottom: 16,
    color: '#000',
  },
  description: {
    fontSize: 18,
    lineHeight: 26,
    color: '#666',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  nextButton: {
    marginTop: 16,
  },
});

export default OnboardingScreen;
