import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getBodyWeights,
  getLatestUserGoal,
  getUserProfile,
} from '../../lib/profile';
import { useAuthStore } from '../../stores/auth-store';
import { AI_GOAL_LABEL, useAIPlanStore } from '../../stores/ai-plan-store';
import { useAppTheme } from '../../theme';
import {
  BodyWeightRecord,
  PROFILE_GENDER_LABEL,
  UserGoalRecord,
  UserProfileRecord,
} from '../../types/profile';
import { ProfileStackParamList } from '../../types/navigation';

export default function ProfileScreen() {
  const { colors, typography } = useAppTheme();
  const { user, signOut } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const currentPlan = useAIPlanStore((s) => s.currentPlan);
  const onboardingData = useAIPlanStore((s) => s.onboardingData);

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [goal, setGoal] = useState<UserGoalRecord | null>(null);
  const [weights, setWeights] = useState<BodyWeightRecord[]>([]);

  const loadData = useCallback(async (showSpinner = false) => {
    if (!user?.id) return;
    if (showSpinner) setRefreshing(true);
    else setInitialLoading(true);

    try {
      const [p, g, w] = await Promise.all([
        getUserProfile(user.id),
        getLatestUserGoal(user.id),
        getBodyWeights(user.id, 5),
      ]);
      setProfile(p);
      setGoal(g);
      setWeights(w);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const profileSummary = useMemo(() => {
    if (!profile) return '프로필 정보를 설정해주세요.';
    const parts = [
      profile.gender ? PROFILE_GENDER_LABEL[profile.gender] : null,
      profile.age ? `${profile.age}세` : null,
      profile.height_cm ? `${profile.height_cm}cm` : null,
    ].filter(Boolean);
    return parts.join(' · ') || '기본 정보 미설정';
  }, [profile]);

  if (initialLoading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      >
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accentMuted }]}>
            <MaterialCommunityIcons name="account" size={32} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nickname, { color: colors.text, fontFamily: typography.fontFamily }]}>
              {profile?.nickname || user?.email?.split('@')[0] || '사용자'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: 14 }}>
              {profileSummary}
            </Text>
          </View>
        </View>

        {/* Summary Cards Row */}
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('WeightHistory')}
          >
            <MaterialCommunityIcons name="scale-bathroom" size={24} color={colors.accent} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>현재 체중</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {profile?.weight_kg ? `${profile.weight_kg}kg` : '미입력'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('GoalSettings')}
          >
            <MaterialCommunityIcons name="target" size={24} color={colors.accent} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>목표 칼로리</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {goal?.calories_target ? `${goal.calories_target}kcal` : '미설정'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI 플랜 목표 */}
        {currentPlan && (
          <View style={[styles.aiPlanCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.aiPlanHeader}>
              <View style={{ backgroundColor: colors.accentMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' }}>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>AI 플랜 목표</Text>
              </View>
              {onboardingData?.goal && (
                <Text style={[styles.aiPlanGoal, { color: colors.text, fontFamily: typography.fontFamily }]}>
                  {AI_GOAL_LABEL[onboardingData.goal] ?? onboardingData.goal}
                </Text>
              )}
            </View>
            <View style={styles.aiPlanRow}>
              <Text style={[styles.aiPlanLabel, { color: colors.textSecondary }]}>목표 칼로리</Text>
              <Text style={[styles.aiPlanValue, { color: colors.text }]}>{currentPlan.targetCalories} kcal</Text>
            </View>
            <View style={styles.aiPlanMacros}>
              <View style={styles.aiPlanMacroItem}>
                <Text style={[styles.aiPlanLabel, { color: colors.textSecondary }]}>단백질</Text>
                <Text style={[styles.aiPlanValue, { color: colors.protein ?? colors.text }]}>{currentPlan.targetMacros.protein}g</Text>
              </View>
              <View style={styles.aiPlanMacroItem}>
                <Text style={[styles.aiPlanLabel, { color: colors.textSecondary }]}>탄수화물</Text>
                <Text style={[styles.aiPlanValue, { color: colors.carbs ?? colors.text }]}>{currentPlan.targetMacros.carbs}g</Text>
              </View>
              <View style={styles.aiPlanMacroItem}>
                <Text style={[styles.aiPlanLabel, { color: colors.textSecondary }]}>지방</Text>
                <Text style={[styles.aiPlanValue, { color: colors.fat ?? colors.text }]}>{currentPlan.targetMacros.fat}g</Text>
              </View>
            </View>
            <Text style={[styles.aiPlanDate, { color: colors.textTertiary }]}>
              생성일: {new Date(currentPlan.generatedAt).toLocaleDateString('ko-KR')}
            </Text>
          </View>
        )}

        {/* Menu List */}
        <View style={[styles.menuContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem
            icon="account-edit-outline"
            label="개인 정보 수정"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuItem
            icon="flag-outline"
            label="목표 및 영양 설정"
            onPress={() => navigation.navigate('GoalSettings')}
          />
          <MenuItem
            icon="history"
            label="체중 기록 히스토리"
            onPress={() => navigation.navigate('WeightHistory')}
          />
        </View>

        <Button
          mode="outlined"
          onPress={signOut}
          style={styles.signOutButton}
          textColor={colors.error}
        >
          로그아웃
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const { colors, typography } = useAppTheme();
  return (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.textSecondary} />
        <Text style={{ color: colors.text, fontFamily: typography.fontFamily, fontSize: 16 }}>{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 16 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nickname: { fontSize: 20, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  summaryValue: { fontSize: 18, fontWeight: '600' },
  aiPlanCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  aiPlanHeader: { gap: 8 },
  aiPlanGoal: { fontSize: 18, fontWeight: '700' },
  aiPlanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiPlanMacros: { flexDirection: 'row', justifyContent: 'space-between' },
  aiPlanMacroItem: { alignItems: 'center', flex: 1 },
  aiPlanLabel: { fontSize: 12, marginBottom: 2 },
  aiPlanValue: { fontSize: 16, fontWeight: '700' },
  aiPlanDate: { fontSize: 11 },
  menuContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  signOutButton: { marginTop: 8 },
});
