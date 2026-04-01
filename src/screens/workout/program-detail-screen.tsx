import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { isNsunsProgram } from '../../lib/nsuns';
import { useProgramStore } from '../../stores/program-store';
import { useAuthStore } from '../../stores/auth-store';
import { useWorkoutStore } from '../../stores/workout-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';
import { Program, ProgramDayWithExercises, ProgramReview } from '../../types/program';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'ProgramDetail'>;
  route: RouteProp<WorkoutStackParamList, 'ProgramDetail'>;
};

// ─── Stars display ────────────────────────────────────────────────────────────

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <MaterialCommunityIcons
          key={n}
          name={n <= Math.round(value) ? 'star' : 'star-outline'}
          size={size}
          color="#FBBF24"
        />
      ))}
    </View>
  );
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onEdit,
  onDelete,
}: {
  review: ProgramReview;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { colors, typography } = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const infoLine = [
    review.reviewer_gender,
    review.reviewer_age ? `${review.reviewer_age}세` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const dateStr = new Date(review.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[rcStyles.card, { backgroundColor: colors.card }]}>
      {/* Top row */}
      <View style={rcStyles.topRow}>
        <View style={[rcStyles.avatar, { backgroundColor: colors.accent + '22' }]}>
          <MaterialCommunityIcons name="account" size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text }}>
            {review.reviewer_display_name ?? '익명'}
          </Text>
          {infoLine ? (
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary, marginTop: 1 }}>
              {infoLine}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[rcStyles.weekBadge, { backgroundColor: colors.accent + '18' }]}>
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.accent }}>
              {review.weeks_completed}주 진행
            </Text>
          </View>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary }}>
            {dateStr}
          </Text>
          {(onEdit || onDelete) && (
            <TouchableOpacity onPress={() => setMenuVisible((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Inline menu */}
      {menuVisible && (
        <View style={[rcStyles.menu, { borderColor: colors.border, backgroundColor: colors.background }]}>
          {onEdit && (
            <TouchableOpacity style={rcStyles.menuItem} onPress={() => { setMenuVisible(false); onEdit(); }} activeOpacity={0.7}>
              <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.text} />
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.text, marginLeft: 8 }}>수정</Text>
            </TouchableOpacity>
          )}
          {onEdit && onDelete && <View style={[rcStyles.menuDivider, { backgroundColor: colors.border }]} />}
          {onDelete && (
            <TouchableOpacity style={rcStyles.menuItem} onPress={() => { setMenuVisible(false); onDelete(); }} activeOpacity={0.7}>
              <MaterialCommunityIcons name="trash-can-outline" size={15} color="#ef4444" />
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: '#ef4444', marginLeft: 8 }}>삭제</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Ratings */}
      <View style={[rcStyles.ratingsBox, { borderColor: colors.border }]}>
        <View style={rcStyles.ratingRow}>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary, width: 100 }}>
            Strength Gain
          </Text>
          <Stars value={review.strength_gain} />
        </View>
        <View style={rcStyles.ratingRow}>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary, width: 100 }}>
            Muscle Gain
          </Text>
          <Stars value={review.muscle_gain} />
        </View>
        <View style={rcStyles.ratingRow}>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary, width: 100 }}>
            전체 만족도
          </Text>
          <Stars value={review.overall_rating} />
        </View>
      </View>

      {/* Review text */}
      {review.review_text ? (
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.text, lineHeight: 20, marginTop: 10 }}>
          {review.review_text}
        </Text>
      ) : null}
    </View>
  );
}

const rcStyles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, marginBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  weekBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ratingsBox: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  menu: { borderWidth: 1, borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  menuDivider: { height: StyleSheet.hairlineWidth },
});

// ─── RatingSummary ────────────────────────────────────────────────────────────

function RatingSummary({ reviews }: { reviews: ProgramReview[] }) {
  const { colors, typography } = useAppTheme();
  if (reviews.length === 0) return null;

  const avg = (key: keyof Pick<ProgramReview, 'strength_gain' | 'muscle_gain' | 'overall_rating'>) =>
    reviews.reduce((s, r) => s + r[key], 0) / reviews.length;

  const overallAvg = avg('overall_rating');

  return (
    <View style={[rsStyles.box, { backgroundColor: colors.card }]}>
      <View style={rsStyles.left}>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: 42, fontWeight: '800', color: colors.text, lineHeight: 48 }}>
          {overallAvg.toFixed(1)}
        </Text>
        <Stars value={overallAvg} size={16} />
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary, marginTop: 4 }}>
          {reviews.length}개 리뷰
        </Text>
      </View>
      <View style={[rsStyles.divider, { backgroundColor: colors.border }]} />
      <View style={rsStyles.right}>
        {(
          [
            { key: 'overall_rating', label: '전체 만족도' },
            { key: 'strength_gain', label: 'Strength Gain' },
            { key: 'muscle_gain', label: 'Muscle Gain' },
          ] as const
        ).map(({ key, label }) => {
          const v = avg(key);
          return (
            <View key={key} style={rsStyles.barRow}>
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary, width: 88 }}>
                {label}
              </Text>
              <View style={[rsStyles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[rsStyles.barFill, { backgroundColor: '#FBBF24', width: `${(v / 5) * 100}%` }]} />
              </View>
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary, width: 24, textAlign: 'right' }}>
                {v.toFixed(1)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const rsStyles = StyleSheet.create({
  box: { flexDirection: 'row', borderRadius: 16, padding: 16, alignItems: 'center', gap: 16 },
  left: { alignItems: 'center', width: 80 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  right: { flex: 1, gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});

// ─── ProgramDetailScreen ──────────────────────────────────────────────────────

export default function ProgramDetailScreen({ navigation, route }: Props) {
  const { programId } = route.params;
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();
  const {
    activeUserPrograms,
    fetchActiveProgram,
    fetchProgramDays,
    fetchProgramDayExercises,
    fetchUserTMs,
    enrollProgram,
    unenrollProgram,
    deleteProgram,
  } = useProgramStore();
  const workoutStore = useWorkoutStore();

  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<ProgramDayWithExercises[]>([]);
  const [reviews, setReviews] = useState<ProgramReview[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewsAvailable, setReviewsAvailable] = useState(true);
  const [userCompletedSessions, setUserCompletedSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const currentEnrollment =
    activeUserPrograms.find((entry) => entry.program_id === programId) ?? null;
  const isActive = Boolean(currentEnrollment);
  const isOwn = program?.user_id === user?.id;
  const isNsuns = program ? isNsunsProgram(program.creator_name ?? null, program.name) : false;

  const load = useCallback(async () => {
    setLoading(true);
    await fetchActiveProgram();

    const [{ data: prog }, dayData, reviewsResult, enrollResult] = await Promise.all([
      supabase.from('programs').select('*').eq('id', programId).single(),
      fetchProgramDays(programId),
      supabase
        .from('program_reviews')
        .select('*')
        .eq('program_id', programId)
        .order('created_at', { ascending: false }),
      user?.id
        ? supabase
            .from('user_programs')
            .select('completed_sessions')
            .eq('program_id', programId)
            .eq('user_id', user.id)
            .order('completed_sessions', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const reviewsMissing = reviewsResult.error?.code === 'PGRST205';
    const revData = reviewsMissing ? null : reviewsResult.data;

    if (prog) setProgram(prog as Program);
    setDays(dayData);
    setReviews((revData ?? []) as ProgramReview[]);
    setReviewsAvailable(!reviewsMissing);
    setUserCompletedSessions((enrollResult.data as { completed_sessions?: number } | null)?.completed_sessions ?? 0);

    if (user?.id && revData) {
      setHasReviewed(revData.some((r: any) => r.user_id === user.id));
    }

    setLoading(false);
  }, [programId, fetchActiveProgram, fetchProgramDays, user?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => navigation.addListener('focus', load), [navigation, load]);

  const handleEnroll = async () => {
    if (!user) {
      Alert.alert('로그인 필요', '프로그램을 시작하려면 로그인이 필요합니다.');
      return;
    }
    setActionLoading(true);
    try {
      await enrollProgram(programId);
      Alert.alert('시작!', '프로그램이 시작됐어요. 운동 화면에서 오늘의 운동을 시작하세요!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!currentEnrollment) return;
    if (Platform.OS === 'web') {
      if (!window.confirm('정말 이 프로그램을 중단할까요?')) return;
      await unenrollProgram(currentEnrollment.id);
      navigation.goBack();
    } else {
      Alert.alert('프로그램 중단', '정말 이 프로그램을 중단할까요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '중단',
          style: 'destructive',
          onPress: async () => {
            await unenrollProgram(currentEnrollment.id);
            navigation.goBack();
          },
        },
      ]);
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('정말 삭제할까요? 되돌릴 수 없어요.')) return;
      await deleteProgram(programId);
      navigation.goBack();
    } else {
      Alert.alert('프로그램 삭제', '정말 삭제할까요? 되돌릴 수 없어요.', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteProgram(programId);
            navigation.goBack();
          },
        },
      ]);
    }
  };

  const handleStartTodaysWorkout = async () => {
    if (!currentEnrollment || !program) return;
    setActionLoading(true);
    try {
      const exercises = await fetchProgramDayExercises(
        programId,
        currentEnrollment.current_day,
      );

      let tms: Record<string, number> | undefined;
      if (isNsuns) {
        const fetched = await fetchUserTMs(currentEnrollment.id);
        if (!fetched || Object.keys(fetched).length === 0) {
          navigation.navigate('TrainingMaxSetup', {
            userProgramId: currentEnrollment.id,
            programName: program.name,
            autoStartWorkout: true,
            programId,
            currentDay: currentEnrollment.current_day,
            daysPerWeek: program.days_per_week,
          });
          setActionLoading(false);
          return;
        }
        tms = fetched;
      }

      await workoutStore.startFromProgram(
        exercises,
        currentEnrollment.id,
        program.days_per_week,
        currentEnrollment.current_day,
        tms,
      );
      navigation.navigate('WorkoutSession');
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWriteReview = () => {
    if (userCompletedSessions < 1) {
      if (Platform.OS === 'web') {
        window.alert('프로그램을 최소 1회 완료해야 리뷰를 작성할 수 있어요.');
      } else {
        Alert.alert('리뷰 작성 불가', '프로그램을 최소 1회 완료해야 리뷰를 작성할 수 있어요.');
      }
      return;
    }
    navigation.navigate('ProgramReview', { programId, programName: program!.name });
  };

  const handleDeleteReview = async (reviewId: string) => {
    const doDelete = async () => {
      await supabase.from('program_reviews').delete().eq('id', reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setHasReviewed(false);
    };
    if (Platform.OS === 'web') {
      if (!window.confirm('리뷰를 삭제할까요?')) return;
      await doDelete();
    } else {
      Alert.alert('리뷰 삭제', '정말 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!program) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily }}>
            프로그램을 불러올 수 없어요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: typography.fontFamily, fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, flex: 1, marginLeft: 12 }}
          numberOfLines={1}
        >
          {program.name}
        </Text>
        {isOwn && (
          <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          {[
            { value: `${program.duration_weeks}주`, label: '기간' },
            { value: `주 ${program.days_per_week}일`, label: '훈련 빈도' },
            { value: `${program.duration_weeks * program.days_per_week}회`, label: '총 세션' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
              <View style={styles.statItem}>
                <Text style={{ fontFamily: typography.fontFamily, fontSize: 18, fontWeight: '700', color: colors.accent }}>{s.value}</Text>
                <Text style={{ fontFamily: typography.fontFamily, fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Description */}
        {program.description ? (
          <View style={[styles.descBox, { backgroundColor: colors.card }]}>
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 20 }}>
              {program.description}
            </Text>
          </View>
        ) : null}

        {/* Active status */}
        {isActive && currentEnrollment && (
          <View style={[styles.activeBox, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '44' }]}>
            <MaterialCommunityIcons name="play-circle" size={18} color={colors.accent} />
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.accent, marginLeft: 6 }}>
              진행 중 — Day {currentEnrollment.current_day} / {program.days_per_week}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.accent, marginLeft: 'auto' }}>
              {currentEnrollment.completed_sessions}회 완료
            </Text>
          </View>
        )}

        {/* Days */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
          프로그램 구성
        </Text>

        {days.map((day) => (
          <View key={day.id} style={[styles.dayCard, { backgroundColor: colors.card }]}>
            <View style={styles.dayHeader}>
              <View style={[styles.dayBadge, { backgroundColor: colors.accent }]}>
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: '#fff' }}>
                  D{day.day_number}
                </Text>
              </View>
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text, marginLeft: 8 }}>
                {day.name ?? `Day ${day.day_number}`}
              </Text>
            </View>
            {day.program_exercises?.length > 0 ? (
              day.program_exercises.map((pe) => (
                <View key={pe.id} style={[styles.exRow, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text }}>
                      {pe.exercises?.name_ko ?? '알 수 없는 종목'}
                    </Text>
                    {pe.exercises?.category ? (
                      <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary, marginTop: 1 }}>
                        {pe.exercises.category}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary }}>
                    {pe.target_sets}세트 × {pe.target_reps}회{pe.target_weight_kg > 0 ? ` @ ${pe.target_weight_kg}kg` : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textTertiary, marginTop: 8 }}>종목 없음</Text>
            )}
          </View>
        ))}

        {/* Reviews section */}
        {reviewsAvailable ? (
          <>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily, marginTop: 0, marginBottom: 0 }]}>
                리뷰 ({reviews.length})
              </Text>
              {user && !isOwn && !hasReviewed && (
                <TouchableOpacity
                  style={[styles.writeReviewBtn, { backgroundColor: colors.accent }]}
                  onPress={handleWriteReview}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: '#fff', marginLeft: 4 }}>
                    리뷰 작성
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {reviews.length > 0 ? (
              <>
                <RatingSummary reviews={reviews} />
                <View style={{ height: 12 }} />
                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    onEdit={r.user_id === user?.id ? () => navigation.navigate('ProgramReview', { programId, programName: program.name }) : undefined}
                    onDelete={r.user_id === user?.id ? () => handleDeleteReview(r.id) : undefined}
                  />
                ))}
              </>
            ) : (
              <View style={[styles.emptyReviews, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="star-outline" size={32} color={colors.textTertiary} />
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                  아직 리뷰가 없어요{'\n'}첫 번째 리뷰를 남겨보세요!
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.emptyReviews, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="message-text-outline" size={32} color={colors.textTertiary} />
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
              리뷰 기능은 아직 준비 중입니다.
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {isActive ? (
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={handleUnenroll}
              activeOpacity={0.7}
            >
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textSecondary }}>
                중단하기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent, flex: 1 }]}
              onPress={handleStartTodaysWorkout}
              activeOpacity={0.85}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: '#fff' }}>
                  오늘의 운동 시작
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={handleEnroll}
            activeOpacity={0.85}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: '#fff' }}>
                이 프로그램 시작하기
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: { padding: 16 },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, marginHorizontal: 4 },
  descBox: { borderRadius: 14, padding: 14, marginBottom: 12 },
  activeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  dayCard: { borderRadius: 14, padding: 14, marginBottom: 10 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dayBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  emptyReviews: {
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
