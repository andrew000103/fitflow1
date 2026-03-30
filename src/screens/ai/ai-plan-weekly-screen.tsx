import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function DiffRow({ label, prev, next }: { label: string; prev: string; next: string }) {
  const { colors } = useAppTheme();
  const changed = prev !== next;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: changed ? colors.accent : colors.text, fontSize: 14, fontWeight: changed ? '600' : '400' }}>
        {changed ? `${prev} → ${next}` : next}
      </Text>
    </View>
  );
}

export default function AIPlanWeeklyScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NavProp>();
  const { currentPlan, previousPlan, restorePreviousPlan, isAdjusting, applyRuleBasedAdjustment } = useAIPlanStore();
  const { user } = useAuthStore();
  const s = styles(colors);

  const handleApply = () => {
    navigation.goBack();
  };

  const handleKeepOld = () => {
    restorePreviousPlan();
    navigation.goBack();
  };

  const handleAdjust = async () => {
    if (!user?.id) return;
    await applyRuleBasedAdjustment(user.id);
    navigation.goBack();
  };

  if (!currentPlan) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 40 }}>플랜이 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const prev = previousPlan;
  const next = currentPlan;

  const prevWorkoutDays = prev
    ? prev.weeklyWorkout.filter((d) => !d.isRestDay).length
    : null;
  const nextWorkoutDays = next.weeklyWorkout.filter((d) => !d.isRestDay).length;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={handleApply} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>새로운 주간 플랜</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {prev ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>지난 주 vs 이번 주 변경사항</Text>
            <View style={s.divider} />
            <DiffRow
              label="목표 칼로리"
              prev={`${prev.targetCalories}kcal`}
              next={`${next.targetCalories}kcal`}
            />
            <DiffRow
              label="단백질 목표"
              prev={`${prev.targetMacros.protein}g`}
              next={`${next.targetMacros.protein}g`}
            />
            <DiffRow
              label="운동 일수"
              prev={`${prevWorkoutDays}일`}
              next={`${nextWorkoutDays}일`}
            />
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.cardTitle}>이번 주 플랜</Text>
            <View style={s.divider} />
            <DiffRow label="목표 칼로리" prev="" next={`${next.targetCalories}kcal`} />
            <DiffRow label="단백질 목표" prev="" next={`${next.targetMacros.protein}g`} />
            <DiffRow label="운동 일수" prev="" next={`${nextWorkoutDays}일`} />
          </View>
        )}

        <View style={s.card}>
          <Text style={s.cardTitle}>AI 설명</Text>
          <View style={s.divider} />
          <Text style={s.summaryText}>{next.explanation.summary}</Text>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.primaryBtn} onPress={handleApply}>
          <Text style={s.primaryBtnText}>이번 주 플랜 적용하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.adjustBtn, isAdjusting && { opacity: 0.5 }]}
          onPress={handleAdjust}
          disabled={isAdjusting}
          activeOpacity={0.8}
        >
          {isAdjusting ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={s.adjustBtnText}>중량 자동 조정 (지난 주 기반)</Text>
          )}
        </TouchableOpacity>
        {prev && (
          <TouchableOpacity style={s.secondaryBtn} onPress={handleKeepOld}>
            <Text style={s.secondaryBtnText}>이전 플랜 유지</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    backBtn: { padding: 8 },
    backText: { fontSize: 20, color: colors.text },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, gap: 16 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 12 },
    summaryText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingBottom: 40,
      paddingTop: 12,
      backgroundColor: colors.background,
      gap: 10,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryBtnText: { fontSize: 17, fontWeight: '600', color: '#fff' },
    adjustBtn: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    adjustBtnText: { fontSize: 15, fontWeight: '600', color: colors.accent },
    secondaryBtn: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryBtnText: { fontSize: 15, color: colors.textSecondary },
  });
