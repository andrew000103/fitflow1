import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { addBodyWeight, deleteBodyWeight, getBodyWeights, updateBodyWeight } from '../../lib/profile';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { BodyWeightRecord } from '../../types/profile';
import { Field, Section } from '../../components/profile/profile-components';

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WeightHistoryScreen() {
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [weights, setWeights] = useState<BodyWeightRecord[]>([]);
  const [editingEntry, setEditingEntry] = useState<BodyWeightRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BodyWeightRecord | null>(null);

  const [weightKg, setWeightKg] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [muscleMassKg, setMuscleMassKg] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async (showSpinner = false) => {
    if (!user?.id) return;
    if (showSpinner) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getBodyWeights(user.id, 50);
      setWeights(data);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const resetForm = useCallback(() => {
    setWeightKg('');
    setBodyFatPct('');
    setMuscleMassKg('');
    setNotes('');
  }, []);

  const handleEditWeight = useCallback((entry: BodyWeightRecord) => {
    setEditingEntry(entry);
    setWeightKg(String(entry.weight_kg));
    setBodyFatPct(entry.body_fat_pct != null ? String(entry.body_fat_pct) : '');
    setMuscleMassKg(entry.muscle_mass_kg != null ? String(entry.muscle_mass_kg) : '');
    setNotes(entry.notes ?? '');
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingEntry(null);
    resetForm();
  }, [resetForm]);

  const closeDeleteModal = useCallback(() => {
    if (deletingId) return;
    setDeleteTarget(null);
  }, [deletingId]);

  const handleAddWeight = async () => {
    if (!user?.id) return;
    const parsedWeight = parseOptionalNumber(weightKg);
    if (!parsedWeight || parsedWeight <= 0) {
      Alert.alert('입력 필요', '체중을 올바르게 입력하세요.');
      return;
    }

    setSaving(true);
    try {
      await addBodyWeight(user.id, {
        weight_kg: parsedWeight,
        body_fat_pct: parseOptionalNumber(bodyFatPct),
        muscle_mass_kg: parseOptionalNumber(muscleMassKg),
        notes: notes.trim() || undefined,
      });

      resetForm();
      await loadData(true);
      Alert.alert('성공', '기록이 추가되었습니다.');
    } catch (error) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWeight = async () => {
    if (!user?.id || !editingEntry) return;
    const parsedWeight = parseOptionalNumber(weightKg);
    if (!parsedWeight || parsedWeight <= 0) {
      Alert.alert('입력 필요', '체중을 올바르게 입력하세요.');
      return;
    }

    setSaving(true);
    try {
      await updateBodyWeight(user.id, editingEntry.id, {
        weight_kg: parsedWeight,
        body_fat_pct: parseOptionalNumber(bodyFatPct),
        muscle_mass_kg: parseOptionalNumber(muscleMassKg),
        notes: notes.trim() || undefined,
        measured_at: editingEntry.measured_at,
      });

      closeEditModal();
      await loadData(true);
      Alert.alert('성공', '기록이 수정되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error?.message ? `수정 중 오류가 발생했습니다.\n${error.message}` : '수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const performDeleteWeight = useCallback(async (entry: BodyWeightRecord) => {
    if (!user?.id) return;

    setDeletingId(entry.id);
    try {
      await deleteBodyWeight(user.id, entry.id);
      setWeights((prev) => prev.filter((item) => item.id !== entry.id));
      if (editingEntry?.id === entry.id) {
        closeEditModal();
      }
      setDeleteTarget(null);
      await loadData(true);
      Alert.alert('성공', '기록이 삭제되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error?.message ? `삭제 중 오류가 발생했습니다.\n${error.message}` : '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  }, [closeEditModal, editingEntry?.id, loadData, user?.id]);

  const handleDeleteWeight = useCallback((entry: BodyWeightRecord) => {
    setDeleteTarget(entry);
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      >
        <Section title="새 기록 추가">
          <Field label="체중(kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="72.4" />
          <View style={styles.row}>
            <View style={styles.half}>
              <Field label="체지방률(%)" value={bodyFatPct} onChangeText={setBodyFatPct} keyboardType="decimal-pad" placeholder="18.2" />
            </View>
            <View style={styles.half}>
              <Field label="골격근량(kg)" value={muscleMassKg} onChangeText={setMuscleMassKg} keyboardType="decimal-pad" placeholder="33.5" />
            </View>
          </View>
          <Field label="메모" value={notes} onChangeText={setNotes} placeholder="컨디션 등" multiline />
          <Button mode="contained" onPress={handleAddWeight} loading={saving} disabled={deletingId !== null}>추가하기</Button>
        </Section>

        <Section title="이전 기록">
          {weights.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily }}>기록이 없습니다.</Text>
          ) : (
            weights.map((entry) => (
              <View key={entry.id} style={[styles.weightRow, { borderBottomColor: colors.border }]}>
                <View style={styles.weightInfo}>
                  <Text style={{ color: colors.text, fontFamily: typography.fontFamily, fontSize: 16, fontWeight: '600' }}>
                    {entry.weight_kg}kg
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: 12 }}>
                    {formatDate(entry.measured_at)}
                  </Text>
                  {entry.notes ? (
                    <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: 12, marginTop: 4 }}>
                      {entry.notes}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.weightMeta}>
                  {entry.body_fat_pct != null && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>체지방 {entry.body_fat_pct}%</Text>}
                  {entry.muscle_mass_kg != null && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>근육량 {entry.muscle_mass_kg}kg</Text>}
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={() => handleEditWeight(entry)}
                      disabled={saving || deletingId === entry.id}
                      style={[styles.itemActionButton, { backgroundColor: colors.accentMuted }]}
                    >
                      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteWeight(entry)}
                      disabled={saving || deletingId === entry.id}
                      style={[styles.itemActionButton, { backgroundColor: colors.errorMuted }]}
                    >
                      <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>
                        {deletingId === entry.id ? '삭제 중' : '삭제'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
      <Modal visible={Boolean(editingEntry)} transparent animationType="slide" onRequestClose={closeEditModal}>
        <TouchableWithoutFeedback onPress={closeEditModal}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
                <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
                <Text style={{ color: colors.text, fontFamily: typography.fontFamily, fontSize: 18, fontWeight: '700' }}>
                  체중 기록 수정
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: 13, marginTop: 4, marginBottom: 16 }}>
                  {editingEntry ? formatDate(editingEntry.measured_at) : ''}
                </Text>

                <Field label="체중(kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="72.4" />
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Field label="체지방률(%)" value={bodyFatPct} onChangeText={setBodyFatPct} keyboardType="decimal-pad" placeholder="18.2" />
                  </View>
                  <View style={styles.half}>
                    <Field label="골격근량(kg)" value={muscleMassKg} onChangeText={setMuscleMassKg} keyboardType="decimal-pad" placeholder="33.5" />
                  </View>
                </View>
                <Field label="메모" value={notes} onChangeText={setNotes} placeholder="컨디션 등" multiline />

                <View style={styles.actionRow}>
                  <Button mode="contained" onPress={handleUpdateWeight} loading={saving} disabled={deletingId !== null} style={{ flex: 1 }}>
                    저장
                  </Button>
                  <Button mode="text" onPress={closeEditModal} disabled={saving}>
                    닫기
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal visible={Boolean(deleteTarget)} transparent animationType="fade" onRequestClose={closeDeleteModal}>
        <TouchableWithoutFeedback onPress={closeDeleteModal}>
          <View style={[styles.modalBackdrop, styles.centeredModalBackdrop]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontFamily: typography.fontFamily, fontSize: 18, fontWeight: '700' }}>
                  기록 삭제
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: 14, marginTop: 8, lineHeight: 20 }}>
                  {deleteTarget ? `${deleteTarget.weight_kg}kg 기록을 삭제할까요?\n삭제 후에는 되돌릴 수 없습니다.` : ''}
                </Text>
                <View style={[styles.actionRow, { justifyContent: 'flex-end', marginTop: 20 }]}>
                  <Button mode="text" onPress={closeDeleteModal} disabled={Boolean(deletingId)}>
                    취소
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor={colors.error}
                    onPress={() => {
                      if (deleteTarget) {
                        void performDeleteWeight(deleteTarget);
                      }
                    }}
                    loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
                    disabled={!deleteTarget}
                  >
                    삭제
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 16 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  centeredModalBackdrop: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 16,
  },
  confirmCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  weightInfo: { flex: 1 },
  weightMeta: { alignItems: 'flex-end', gap: 4 },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  itemActionButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
