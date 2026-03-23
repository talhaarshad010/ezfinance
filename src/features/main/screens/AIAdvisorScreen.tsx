import React, { useState } from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, TextInput} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {Typography} from '../../../components';
import {colors} from '../../../theme/colors';
import { useToast } from '../../../context/ToastContext';

const AIAdvisorScreen = () => {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const { showToast } = useToast();
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Intro */}
        <View style={styles.introBox}>
          <Typography variant="h1" weight="700" style={{fontSize: 28}}>AI Financial Advisor</Typography>
          <Typography variant="body" color="#666" style={{marginTop: 8}}>
            Your editorial guide to wealth management. Ask me about spending patterns, portfolio optimization, or budget planning.
          </Typography>
        </View>

        {/* Message 1: AI */}
        <View style={styles.messageRowLeft}>
          <View style={styles.aiAvatar}><Feather name="cpu" size={16} color="#FFF" /></View>
          <View>
             <View style={styles.bubbleLeft}>
               <Typography variant="body" style={styles.msgText}>
                 Good morning. I've analyzed your spending for November. You've successfully reduced "Dining Out" by 14%, which puts you $240 ahead of your savings target.
               </Typography>
             </View>
             <Typography variant="caption" color="#AAA" style={styles.timestampLeft}>EZAI • 09:12 AM</Typography>
          </View>
        </View>

        {/* Message 2: User */}
        <View style={styles.messageRowRight}>
          <View>
             <View style={styles.bubbleRight}>
               <Typography variant="body" color="#FFF" style={styles.msgText}>
                 That's great. Where should I allocate that extra $240 for the best long-term growth?
               </Typography>
             </View>
             <Typography variant="caption" color="#AAA" style={styles.timestampRight}>YOU • 09:14 AM</Typography>
          </View>
        </View>

        {/* Message 3: AI with Cards */}
        <View style={styles.messageRowLeft}>
          <View style={styles.aiAvatar}><Feather name="cpu" size={16} color="#FFF" /></View>
          <View style={{flex: 1}}>
             <View style={styles.bubbleLeft}>
               <Typography variant="body" style={styles.msgText}>
                 Based on your risk profile, I recommend splitting the surplus:
               </Typography>
               
               {/* Suggestion Cards */}
               <View style={styles.suggestionCard}>
                 <View style={styles.dotLabel}><View style={[styles.dot, {backgroundColor: '#0047AB'}]} /><Typography variant="caption" weight="700" color="#666">GROWTH ETF (70%)</Typography></View>
                 <Typography variant="h2" weight="700" style={{marginTop: 8}}>$168</Typography>
                 <Typography variant="caption" color="#666">Projected 8.2% APY</Typography>
               </View>

               <View style={styles.suggestionCard}>
                 <View style={styles.dotLabel}><View style={[styles.dot, {backgroundColor: '#000'}]} /><Typography variant="caption" weight="700" color="#666">EMERGENCY FUND (30%)</Typography></View>
                 <Typography variant="h2" weight="700" style={{marginTop: 8}}>$72</Typography>
                 <Typography variant="caption" color="#666">High-Yield Savings</Typography>
               </View>

               <View style={styles.quoteBox}>
                  <Typography variant="body" style={{fontStyle: 'italic'}}>"Consistency in small allocations builds the foundation for compound authority."</Typography>
               </View>

             </View>
             <Typography variant="caption" color="#AAA" style={styles.timestampLeft}>EZAI • 09:15 AM</Typography>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             <TouchableOpacity 
                style={styles.chip}
                onPress={() => showToast('Executing based on AI recommendation.', 'success', 'Action')}
             >
                <Typography variant="caption" weight="700">Execute this split</Typography>
             </TouchableOpacity>
             <TouchableOpacity 
                style={styles.chip}
                onPress={() => showToast('Generating detailed risk profile report.', 'info', 'Risk Analysis')}
             >
                <Typography variant="caption" weight="700">Show risk analysis</Typography>
             </TouchableOpacity>
             <TouchableOpacity 
                style={styles.chip}
                onPress={() => showToast('Searching for comparable allocation strategies.', 'info', 'Alternatives')}
             >
                <Typography variant="caption" weight="700">Other options?</Typography>
             </TouchableOpacity>
          </ScrollView>
        </View>
        
        <View style={{height: 20}} />
      </ScrollView>

      {/* Input Area */}
      {/* Inside Input Area container we conditionally render absolute popup */}
      <View style={styles.inputContainer}>
        {showAttachMenu && (
          <View style={styles.attachMenu}>
             <TouchableOpacity style={styles.attachOption} onPress={() => [showToast('Image upload opening.', 'info', 'Upload'), setShowAttachMenu(false)]}>
               <Feather name="image" size={18} color="#000" />
               <Typography variant="caption" weight="700" style={{marginLeft: 12}}>Image</Typography>
             </TouchableOpacity>
             <TouchableOpacity style={styles.attachOption} onPress={() => [showToast('Video upload opening.', 'info', 'Upload'), setShowAttachMenu(false)]}>
               <Feather name="video" size={18} color="#000" />
               <Typography variant="caption" weight="700" style={{marginLeft: 12}}>Video</Typography>
             </TouchableOpacity>
             <TouchableOpacity style={styles.attachOption} onPress={() => [showToast('Document upload opening.', 'info', 'Upload'), setShowAttachMenu(false)]}>
               <Feather name="file-text" size={18} color="#000" />
               <Typography variant="caption" weight="700" style={{marginLeft: 12}}>Document</Typography>
             </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity 
            style={styles.attachBtn}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
        >
          <Feather name="paperclip" size={20} color="#666" />
        </TouchableOpacity>
        <TextInput 
          placeholder="Ask EZFinance anything..."
          style={styles.textInput}
          placeholderTextColor="#AAA"
          onFocus={() => setShowAttachMenu(false)}
        />
        <TouchableOpacity 
            style={styles.sendBtn}
            onPress={() => showToast('Sending your message to EZAI...', 'info', 'AI Response')}
        >
          <Feather name="arrow-up" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  introBox: {
    marginBottom: 32,
  },
  messageRowLeft: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
    paddingRight: 40,
  },
  messageRowRight: {
    flexDirection: 'row',
    marginBottom: 24,
    justifyContent: 'flex-end',
    paddingLeft: 40,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bubbleLeft: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    borderTopLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 24,
    borderTopRightRadius: 4,
  },
  msgText: {
    lineHeight: 24,
  },
  timestampLeft: {
    marginTop: 8,
    marginLeft: 8,
    letterSpacing: 1,
  },
  timestampRight: {
    marginTop: 8,
    marginRight: 8,
    textAlign: 'right',
    letterSpacing: 1,
  },
  suggestionCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  dotLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#000',
    paddingLeft: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  quickActions: {
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 8,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  attachBtn: {
    padding: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#000',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  attachMenu: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    width: 150,
  },
  attachOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  }
});

export default AIAdvisorScreen;
