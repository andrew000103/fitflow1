import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useProgramStore } from '../../stores/program-store';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../../stores/workout-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';
import { LocalSet, SessionExercise } from '../../types/workout';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'WorkoutSession'>;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SheetAction = {
  text: string;
  style?: 'default' | 'destructive' | 'cancel';
  onPress?: () => void;
};

type SheetConfig = {
  title: string;
  message?: string;
  actions: SheetAction[];
};

const webBottomShadow = Platform.OS === 'web' ? { boxShadow: '0 -4px 12px rgba(0,0,0,0.15)' } : {};
const webFabShadow = Platform.OS === 'web' ? { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' } : {};
const nativeBottomShadow =
  Platform.OS === 'web'
    ? {}
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
      };
const nativeFabShadow =
  Platform.OS === 'web'
    ? {}
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

interface BottomSheetProps {
  config: SheetConfig | null;
  onDismiss: () => void;
}

function BottomSheet({ config, onDismiss }: BottomSheetProps) {
  const { colors, typography } = useAppTheme();
  if (!config) return null;

  return (
    <View style={sheetStyles.overlay}>
      <TouchableOpacity
        style={sheetStyles.backdrop}
        onPress={onDismiss}
        activeOpacity={1}
      />
      <View style={[sheetStyles.sheet, { backgroundColor: colors.card }]}>
        <Text style={[sheetStyles.sheetTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
          {config.title}
        </Text>
        {config.message ? (
          <Text style={[sheetStyles.sheetMessage, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            {config.message}
          </Text>
        ) : null}
        <View style={[sheetStyles.divider, { backgroundColor: colors.border }]} />
        {config.actions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={[
              sheetStyles.actionBtn,
              i < config.actions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              action.style === 'cancel' && { marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
            ]}
            onPress={() => {
              onDismiss();
              action.onPress?.();
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                sheetStyles.actionText,
                { fontFamily: typography.fontFamily },
                action.style === 'destructive' && { color: '#FF3B30', fontWeight: '600' },
                action.style === 'cancel' && { color: colors.textSecondary },
                action.style !== 'destructive' && action.style !== 'cancel' && { color: colors.accent, fontWeight: '600' },
              ]}
            >
              {action.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 0,
    ...webBottomShadow,
    ...nativeBottomShadow,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sheetMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 16,
  },
  actionBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionText: {
    fontSize: 17,
  },
});

// ─── SetRow ───────────────────────────────────────────────────────────────────

interface SetRowProps {
  set: LocalSet;
  setIndex: number;
  exerciseIndex: number;
  prevSet: { weight_kg: number; reps: number } | null;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
}

function SetRow({
  set,
  setIndex,
  exerciseIndex,
  prevSet,
  onComplete,
  onUncomplete,
  onDelete,
}: SetRowProps) {
  const { colors, typography } = useAppTheme();
  const { updateSetField } = useWorkoutStore();

  const rowBg = set.is_done ? colors.successMuted : 'transparent';
  const isWarmup = !!set.isWarmup;

  const prevLabel = prevSet ? `${prevSet.weight_kg}×${prevSet.reps}` : '-';

  return (
    <View style={[styles.setRow, { backgroundColor: rowBg }]}>
      {/* Set number / Warmup indicator */}
      <View style={styles.setNumWrap}>
        {isWarmup ? (
          <Text
            style={[
              styles.warmupBadge,
              { color: colors.textTertiary, fontFamily: typography.fontFamily },
            ]}
          >
            W
          </Text>
        ) : (
          <>
            <Text
              style={[
                styles.setNum,
                { color: colors.textSecondary, fontFamily: typography.fontFamily },
              ]}
            >
              {set.set_number}
            </Text>
            {set.is_pr && <Text style={styles.prBadge}>🏆</Text>}
          </>
        )}
      </View>

      {/* Previous performance */}
      <View style={styles.prevWrap}>
        <Text
          style={[
            styles.prevText,
            { color: colors.textTertiary, fontFamily: typography.fontFamily },
          ]}
          numberOfLines={1}
        >
          {prevLabel}
        </Text>
      </View>

      {/* Weight */}
      <View style={styles.inputWrap}>
        <TextInput
          style={[
            styles.input,
            {
              color: isWarmup
                ? colors.textTertiary
                : set.is_done
                ? colors.success
                : colors.text,
              fontFamily: typography.fontFamily,
              fontSize: typography.size.md,
              fontWeight: typography.weight.semibold,
              borderBottomColor: set.is_done ? 'transparent' : colors.border,
            },
          ]}
          keyboardType="decimal-pad"
          value={set.weight_kg > 0 ? set.weight_kg.toString() : ''}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          onChangeText={(t) =>
            updateSetField(exerciseIndex, setIndex, 'weight_kg', parseFloat(t) || 0)
          }
          editable={!set.is_done}
          returnKeyType="next"
        />
        <Text
          style={[
            styles.unit,
            { color: colors.textSecondary, fontFamily: typography.fontFamily },
          ]}
        >
          kg
        </Text>
      </View>

      {/* Reps */}
      <View style={styles.inputWrap}>
        <TextInput
          style={[
            styles.input,
            {
              color: isWarmup
                ? colors.textTertiary
                : set.is_done
                ? colors.success
                : colors.text,
              fontFamily: typography.fontFamily,
              fontSize: typography.size.md,
              fontWeight: typography.weight.semibold,
              borderBottomColor: set.is_done ? 'transparent' : colors.border,
            },
          ]}
          keyboardType="number-pad"
          value={set.reps > 0 ? set.reps.toString() : ''}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          onChangeText={(t) =>
            updateSetField(exerciseIndex, setIndex, 'reps', parseInt(t, 10) || 0)
          }
          editable={!set.is_done}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <Text
          style={[
            styles.unit,
            { color: colors.textSecondary, fontFamily: typography.fontFamily },
          ]}
        >
          회
        </Text>
      </View>

      {/* Complete / Uncomplete toggle button */}
      <TouchableOpacity
        style={[
          styles.checkBtn,
          {
            backgroundColor: set.is_done
              ? isWarmup
                ? colors.textTertiary
                : colors.success
              : 'transparent',
            borderColor: set.is_done
              ? isWarmup
                ? colors.textTertiary
                : colors.success
              : colors.border,
          },
        ]}
        onPress={set.is_done ? onUncomplete : onComplete}
        activeOpacity={0.75}
      >
        {set.is_done && <MaterialCommunityIcons name="check" size={20} color="#fff" />}
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteSetBtn}
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        <MaterialCommunityIcons
          name="minus-circle-outline"
          size={18}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    </View>
  );
}

// ─── ExerciseBlock ────────────────────────────────────────────────────────────

interface ExerciseBlockProps {
  item: SessionExercise;
  exerciseIndex: number;
  onCompleteSet: (si: number) => void;
  onUncompleteSet: (si: number) => void;
  onAddSet: () => void;
  onAddWarmupSet: () => void;
  onDeleteExercise: () => void;
  onDeleteSet: (si: number) => void;
  onSetExerciseNote: (note: string) => void;
  showSheet: (config: SheetConfig) => void;
}

function ExerciseBlock({
  item,
  exerciseIndex,
  onCompleteSet,
  onUncompleteSet,
  onAddSet,
  onAddWarmupSet,
  onDeleteExercise,
  onDeleteSet,
  onSetExerciseNote,
  showSheet,
}: ExerciseBlockProps) {
  const { colors, typography } = useAppTheme();
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(item.note ?? '');

  useEffect(() => {
    setNoteText(item.note ?? '');
  }, [item.note]);

  const handleMenuPress = () => {
    showSheet({
      title: item.exercise.name_ko,
      actions: [
        {
          text: '종목 삭제',
          style: 'destructive',
          onPress: onDeleteExercise,
        },
        {
          text: item.note ? '노트 편집' : '노트 추가',
          style: 'default',
          onPress: () => setEditingNote(true),
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ],
    });
  };

  const handleNoteSubmit = () => {
    onSetExerciseNote(noteText.trim());
    setEditingNote(false);
  };

  const getPrevSet = (setIndex: number) => {
    if (!item.prevSets) return null;
    const set = item.sets[setIndex];
    if (!set || set.isWarmup) return null;
    const regularsBefore = item.sets.slice(0, setIndex).filter((s) => !s.isWarmup).length;
    return item.prevSets[regularsBefore] ?? null;
  };

  return (
    <View
      style={[styles.exerciseBlock, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Exercise header */}
      <View style={styles.exHeader}>
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.md,
            fontWeight: typography.weight.semibold,
            color: colors.textTertiary,
            marginRight: 4,
          }}
        >
          {exerciseIndex + 1}.
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
            color: colors.accent,
            flex: 1,
          }}
        >
          {item.exercise.name_ko}
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.xs,
            color: colors.textTertiary,
            marginRight: 4,
          }}
        >
          휴식 {item.exercise.default_rest_seconds}초
        </Text>
        <TouchableOpacity
          onPress={handleMenuPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ padding: 6 }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Exercise note */}
      {(editingNote || item.note) && (
        <View style={[styles.noteRow, { borderBottomColor: colors.border }]}>
          {editingNote ? (
            <TextInput
              style={[
                styles.noteInput,
                {
                  color: colors.text,
                  fontFamily: typography.fontFamily,
                  fontSize: typography.size.sm,
                  borderColor: colors.border,
                },
              ]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="종목 메모..."
              placeholderTextColor={colors.textTertiary}
              multiline
              autoFocus
              onBlur={handleNoteSubmit}
              returnKeyType="done"
              onSubmitEditing={handleNoteSubmit}
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingNote(true)} activeOpacity={0.7}>
              <Text
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.size.sm,
                  color: colors.textSecondary,
                  fontStyle: 'italic',
                }}
              >
                {item.note}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Column headers */}
      <View style={[styles.colHeaders, { borderBottomColor: colors.border }]}>
        <Text
          style={[
            styles.colLabel,
            { color: colors.textTertiary, fontFamily: typography.fontFamily, width: 36 },
          ]}
        >
          SET
        </Text>
        <Text
          style={[
            styles.colLabel,
            {
              color: colors.textTertiary,
              fontFamily: typography.fontFamily,
              width: 60,
              textAlign: 'center',
            },
          ]}
        >
          이전
        </Text>
        <Text
          style={[
            styles.colLabel,
            {
              color: colors.textTertiary,
              fontFamily: typography.fontFamily,
              flex: 1,
              textAlign: 'center',
            },
          ]}
        >
          KG
        </Text>
        <Text
          style={[
            styles.colLabel,
            {
              color: colors.textTertiary,
              fontFamily: typography.fontFamily,
              flex: 1,
              textAlign: 'center',
            },
          ]}
        >
          REPS
        </Text>
        <View style={{ width: 36 + 24 }} />
      </View>

      {/* Sets */}
      {item.sets.map((s, si) => (
        <SetRow
          key={s.localId}
          set={s}
          setIndex={si}
          exerciseIndex={exerciseIndex}
          prevSet={getPrevSet(si)}
          onComplete={() => onCompleteSet(si)}
          onUncomplete={() => onUncompleteSet(si)}
          onDelete={() => onDeleteSet(si)}
        />
      ))}

      {/* Add set / Add warmup set */}
      <View style={[styles.addSetRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.addSetBtn, { borderRightColor: colors.border }]}
          onPress={onAddSet}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={16} color={colors.textSecondary} />
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.sm,
              color: colors.textSecondary,
            }}
          >
            세트 추가
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addWarmupBtn}
          onPress={onAddWarmupSet}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.textTertiary,
              marginRight: 4,
            }}
          >
            W
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.sm,
              color: colors.textTertiary,
            }}
          >
            워밍업 추가
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── RestTimerBanner ──────────────────────────────────────────────────────────

function RestTimerBanner() {
  const { colors, typography } = useAppTheme();
  const { restEndsAt, skipRest, adjustRest } = useWorkoutStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (restEndsAt && now >= restEndsAt) skipRest();
  }, [now, restEndsAt, skipRest]);

  if (!restEndsAt) return null;
  const secondsLeft = Math.max(0, Math.ceil((restEndsAt - now) / 1000));

  return (
    <View style={[styles.restBanner, { backgroundColor: colors.accent }]}>
      <View style={styles.restTimerWrap}>
        <Text style={[styles.restLabel, { fontFamily: typography.fontFamily }]}>휴식 중</Text>
        <Text style={[styles.restTimer, { fontFamily: typography.fontFamily }]}>
          {formatSeconds(secondsLeft)}
        </Text>
      </View>
      <View style={styles.restControls}>
        <TouchableOpacity
          style={styles.adjustBtn}
          onPress={() => adjustRest(-30)}
          activeOpacity={0.7}
        >
          <Text style={[styles.adjustText, { fontFamily: typography.fontFamily }]}>−30</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjustBtn}
          onPress={() => adjustRest(30)}
          activeOpacity={0.7}
        >
          <Text style={[styles.adjustText, { fontFamily: typography.fontFamily }]}>+30</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={skipRest} activeOpacity={0.8}>
          <Text style={[styles.skipText, { fontFamily: typography.fontFamily }]}>건너뛰기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── WorkoutInfoCard ──────────────────────────────────────────────────────────

function WorkoutInfoCard() {
  const { colors, typography } = useAppTheme();
  const { title, notes, setTitle, setNotes } = useWorkoutStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localNotes, setLocalNotes] = useState(notes);

  const handleTitleSubmit = () => {
    const trimmed = localTitle.trim();
    setTitle(trimmed || title);
    setEditingTitle(false);
  };

  const handleNotesSubmit = () => {
    setNotes(localNotes.trim());
    setEditingNotes(false);
  };

  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {editingTitle ? (
        <TextInput
          style={[
            styles.titleInput,
            {
              color: colors.text,
              fontFamily: typography.fontFamily,
              fontSize: typography.size.xl,
              fontWeight: typography.weight.bold,
              borderBottomColor: colors.accent,
            },
          ]}
          value={localTitle}
          onChangeText={setLocalTitle}
          autoFocus
          onBlur={handleTitleSubmit}
          returnKeyType="done"
          onSubmitEditing={handleTitleSubmit}
        />
      ) : (
        <TouchableOpacity onPress={() => { setLocalTitle(title); setEditingTitle(true); }} activeOpacity={0.7}>
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.xl,
              fontWeight: typography.weight.bold,
              color: colors.text,
            }}
          >
            {title}
          </Text>
        </TouchableOpacity>
      )}

      {editingNotes ? (
        <TextInput
          style={[
            styles.notesInput,
            {
              color: colors.text,
              fontFamily: typography.fontFamily,
              fontSize: typography.size.sm,
              borderBottomColor: colors.border,
            },
          ]}
          value={localNotes}
          onChangeText={setLocalNotes}
          placeholder="메모 추가..."
          placeholderTextColor={colors.textTertiary}
          multiline
          autoFocus
          onBlur={handleNotesSubmit}
          returnKeyType="done"
          onSubmitEditing={handleNotesSubmit}
        />
      ) : (
        <TouchableOpacity
          onPress={() => { setLocalNotes(notes); setEditingNotes(true); }}
          activeOpacity={0.7}
          style={{ marginTop: 6 }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.sm,
              color: notes ? colors.textSecondary : colors.textTertiary,
              fontStyle: notes ? 'normal' : 'italic',
            }}
          >
            {notes || '메모 추가...'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── WorkoutSessionScreen ─────────────────────────────────────────────────────

export default function WorkoutSessionScreen({ navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const {
    sessionExercises,
    startedAt,
    startSession,
    addSet,
    addWarmupSet,
    completeSet,
    uncompleteSet,
    finishSession,
    resetSession,
    removeExercise,
    removeSet,
    setExerciseNote,
  } = useWorkoutStore();

  const scrollRef = useRef<ScrollView>(null);
  const [now, setNow] = useState(Date.now());
  const [initError, setInitError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetConfig | null>(null);

  useEffect(() => {
    if (startedAt) return;
    startSession().catch((e: any) => {
      setInitError(e.message ?? '세션을 시작할 수 없습니다.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSeconds = startedAt ? Math.floor((now - startedAt) / 1000) : 0;

  const showSheet = useCallback((config: SheetConfig) => {
    Keyboard.dismiss();
    setActiveSheet(config);
  }, []);

  const dismissSheet = useCallback(() => setActiveSheet(null), []);

  const handleCompleteSet = useCallback(
    async (exerciseIndex: number, setIndex: number) => {
      Keyboard.dismiss();
      try {
        await completeSet(exerciseIndex, setIndex);
      } catch (e: any) {
        showSheet({
          title: '오류',
          message: e.message,
          actions: [{ text: '확인', style: 'cancel' }],
        });
      }
    },
    [completeSet, showSheet],
  );

  const handleUncompleteSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      uncompleteSet(exerciseIndex, setIndex);
    },
    [uncompleteSet],
  );

  const endSession = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const summary = await finishSession();
      // Advance program day if this session was started from a program
      const programCtx = useWorkoutStore.getState().programContext;
      if (programCtx) {
        await useProgramStore.getState().advanceDay(programCtx.userProgramId, programCtx.daysPerWeek);
      }
      navigation.replace('WorkoutSummary', summary);
      resetSession();
    } catch (e: any) {
      setFinishing(false);
      showSheet({
        title: '오류',
        message: e.message ?? '운동 종료 중 오류가 발생했습니다.',
        actions: [{ text: '확인', style: 'cancel' }],
      });
    }
  }, [finishing, finishSession, resetSession, navigation, showSheet]);

  const handleFinish = () => {
    const doneCount = sessionExercises.reduce(
      (n, ex) => n + ex.sets.filter((s) => s.is_done && !s.isWarmup).length,
      0,
    );
    showSheet({
      title: '운동 종료',
      message: doneCount === 0
        ? '완료된 세트가 없습니다. 그래도 종료할까요?'
        : '운동을 종료하고 요약을 확인할까요?',
      actions: [
        { text: '취소', style: 'cancel' },
        {
          text: '종료',
          style: doneCount === 0 ? 'destructive' : 'default',
          onPress: endSession,
        },
      ],
    });
  };

  const handleDiscard = () => {
    showSheet({
      title: '운동 취소',
      message: '진행 중인 운동을 취소할까요?',
      actions: [
        { text: '계속 운동', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: () => {
            resetSession();
            navigation.popToTop();
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleDiscard} style={styles.headerBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.semibold,
            color: colors.text,
          }}
        >
          {formatSeconds(elapsedSeconds)}
        </Text>

        <TouchableOpacity
          style={[styles.finishBtn, { backgroundColor: finishing ? colors.textTertiary : colors.accent }]}
          onPress={handleFinish}
          activeOpacity={0.85}
          disabled={finishing}
        >
          <Text style={[styles.finishText, { fontFamily: typography.fontFamily }]}>
            {finishing ? '저장 중...' : '종료'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── DB Error Banner ── */}
      {initError && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorMuted }]}>
          <MaterialCommunityIcons name="wifi-off" size={14} color={colors.error} />
          <Text
            style={[
              styles.errorText,
              { color: colors.error, fontFamily: typography.fontFamily },
            ]}
          >
            오프라인 모드 — 세트 기록이 저장되지 않을 수 있습니다
          </Text>
        </View>
      )}

      {/* ── Rest Timer Banner ── */}
      <RestTimerBanner />

      {/* ── Main Scroll ── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <WorkoutInfoCard />

        {sessionExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="dumbbell" size={48} color={colors.textTertiary} />
            <Text
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.md,
                color: colors.textSecondary,
                marginTop: 12,
              }}
            >
              아래 버튼으로 종목을 추가하세요
            </Text>
          </View>
        ) : (
          sessionExercises.map((ex, ei) => (
            <ExerciseBlock
              key={ex.exercise.id + ei}
              item={ex}
              exerciseIndex={ei}
              onCompleteSet={(si) => handleCompleteSet(ei, si)}
              onUncompleteSet={(si) => handleUncompleteSet(ei, si)}
              onAddSet={() => addSet(ei)}
              onAddWarmupSet={() => addWarmupSet(ei)}
              onDeleteExercise={() => removeExercise(ei)}
              onDeleteSet={(si) => removeSet(ei, si)}
              onSetExerciseNote={(note) => setExerciseNote(ei, note)}
              showSheet={showSheet}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Add Exercise FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('ExerciseSearch')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={[styles.fabText, { fontFamily: typography.fontFamily }]}>종목 추가</Text>
      </TouchableOpacity>

      {/* ── Custom Bottom Sheet (replaces Alert) ── */}
      <BottomSheet config={activeSheet} onDismiss={dismissSheet} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 44, alignItems: 'flex-start' },
  finishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  finishText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },

  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  restTimerWrap: { flex: 1 },
  restLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restTimer: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 42,
  },
  restControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  adjustText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  scroll: { padding: 16, gap: 12 },

  infoCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 4,
  },
  titleInput: {
    borderBottomWidth: 1.5,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  notesInput: {
    borderBottomWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginTop: 6,
    minHeight: 36,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 4,
  },

  exerciseBlock: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  noteRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  noteInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 40,
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addSetRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  addSetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  addWarmupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  setNumWrap: {
    width: 36,
    alignItems: 'center',
  },
  setNum: {
    fontSize: 15,
    fontWeight: '600',
  },
  warmupBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  prBadge: {
    fontSize: 10,
    lineHeight: 14,
  },
  prevWrap: {
    width: 60,
    alignItems: 'center',
  },
  prevText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  input: {
    textAlign: 'center',
    borderBottomWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 40,
  },
  unit: { fontSize: 13 },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSetBtn: {
    width: 24,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
    ...webFabShadow,
    ...nativeFabShadow,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
