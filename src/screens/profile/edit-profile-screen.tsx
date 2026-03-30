import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getUserProfile, saveUserProfile } from '../../lib/profile';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { PROFILE_GENDER_LABEL, ProfileGender, UserProfileRecord } from '../../types/profile';
import { Field, SelectorRow } from '../../components/profile/profile-components';

const GENDER_OPTIONS: ProfileGender[] = ['male', 'female', 'other'];

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function EditProfileScreen() {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<ProfileGender | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(user.id);
      if (profile) {
        setNickname(profile.nickname ?? '');
        setAvatarUrl(profile.avatar_url ?? '');
        setHeightCm(profile.height_cm ? String(profile.height_cm) : '');
        setWeightKg(profile.weight_kg ? String(profile.weight_kg) : '');
        setAge(profile.age ? String(profile.age) : '');
        setGender(profile.gender);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await saveUserProfile(user.id, {
        nickname,
        avatar_url: avatarUrl,
        height_cm: parseOptionalNumber(heightCm),
        weight_kg: parseOptionalNumber(weightKg),
        age: parseOptionalNumber(age),
        gender: gender ?? undefined,
      });
      Alert.alert('성공', '프로필이 저장되었습니다.');
    } catch (error) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(saving);
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Field label="이메일" value={user?.email ?? ''} onChangeText={() => {}} editable={false} />
      <Field label="닉네임" value={nickname} onChangeText={setNickname} placeholder="표시할 이름" />
      <Field label="아바타 URL" value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://..." />
      <Field label="나이" value={age} onChangeText={setAge} keyboardType="numeric" placeholder="28" />
      <Field label="키(cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" placeholder="175" />
      <Field label="현재 체중(kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="72.4" />
      <SelectorRow options={GENDER_OPTIONS} selected={gender} labels={PROFILE_GENDER_LABEL} onSelect={setGender} />

      <Button mode="contained" onPress={handleSave} loading={saving} style={styles.button}>
        저장하기
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  button: {
    marginTop: 16,
  },
});
