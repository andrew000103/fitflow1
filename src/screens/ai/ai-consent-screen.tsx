import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { AIFlowScreen } from '../../components/ai/AIFlowScreen';
import { saveAIConsent } from '../../lib/ai-planner';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const DATA_ITEMS = [
  '입력하신 신체 정보 (나이, 키, 체중, 목표)',
  '최근 7일 운동 완료 기록',
  '최근 7일 체중 변화 추이',
  '이름 등 개인 식별 정보는 전달되지 않습니다',
];

export default function AIConsentScreen() {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isCompact = width < 380 || height < 760;
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const setNeedsOnboarding = useAIPlanStore((s) => s.setNeedsOnboarding);
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await saveAIConsent(user.id, true);
    } catch {
      // 저장 실패해도 온보딩은 진행 (앱 재시작 시 재시도)
    } finally {
      setLoading(false);
    }
    setNeedsOnboarding(false);
    navigation.replace('AIOnboarding');
  };

  const handleSkip = async () => {
    if (!user?.id) return;
    try {
      await saveAIConsent(user.id, false);
    } catch {
      // 무시
    }
    setNeedsOnboarding(false);
    navigation.goBack();
  };

  const s = styles(colors, { isCompact });

  return (
    <AIFlowScreen
      contentContainerStyle={s.content}
      footer={
        <>
          <TouchableOpacity
            style={[s.primaryBtn, loading && s.btnDisabled]}
            onPress={handleConsent}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>테스트 시작하기</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={s.skipText}>지금은 건너뛰기 (나중에 프로필에서 켜기 가능)</Text>
          </TouchableOpacity>
        </>
      }
    >
        <View style={[s.iconWrap, { backgroundColor: colors.accentMuted }]}>
          <MaterialCommunityIcons name="creation" size={40} color={colors.accent} />
        </View>

        <Text style={s.title}>테스트를 바탕으로{'\n'}현재 결과를 먼저 정리해드릴게요</Text>
        <Text style={s.subtitle}>
          먼저 지금 내 수준과 다음 단계를 정리해드리고,{'\n'}
          원하시면 그다음 맞춤 AI 플랜까지 이어서 만들 수 있어요
        </Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>판정과 추천에 활용하는 정보</Text>
          {DATA_ITEMS.map((item, i) => (
            <View key={i} style={s.dataRow}>
              <Text style={[s.bullet, i === 3 && s.noticeText]}>
                {i === 3 ? '※' : '•'}
              </Text>
              <Text style={[s.dataText, i === 3 && s.noticeText]}>{item}</Text>
            </View>
          ))}
        </View>
    </AIFlowScreen>
  );
}

const styles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  layout: { isCompact: boolean }
) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: layout.isCompact ? 16 : 24,
      paddingTop: layout.isCompact ? 28 : 48,
      alignItems: 'center',
    },
    iconWrap: {
      width: layout.isCompact ? 68 : 80,
      height: layout.isCompact ? 68 : 80,
      borderRadius: layout.isCompact ? 34 : 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: layout.isCompact ? 20 : 24,
    },
    title: {
      fontSize: layout.isCompact ? 22 : 26,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      lineHeight: layout.isCompact ? 30 : 34,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: layout.isCompact ? 14 : 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: layout.isCompact ? 24 : 32,
    },
    card: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: layout.isCompact ? 16 : 20,
      marginBottom: layout.isCompact ? 24 : 32,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 14,
    },
    dataRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    bullet: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
      lineHeight: 20,
    },
    dataText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    noticeText: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    primaryBtn: {
      width: '100%',
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    btnDisabled: {
      opacity: 0.6,
    },
    primaryBtnText: {
      fontSize: layout.isCompact ? 16 : 17,
      fontWeight: '600',
      color: '#fff',
    },
    skipBtn: {
      paddingVertical: 12,
    },
    skipText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
