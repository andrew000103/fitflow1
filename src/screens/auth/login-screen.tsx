import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { AuthStackParamList, RootStackParamList } from '../../types/navigation';

type LoginNavParamList = AuthStackParamList & RootStackParamList;

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LoginNavParamList, 'Login'>>();
  const route = useRoute<RouteProp<LoginNavParamList, 'Login'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { signIn, signInAnonymously, loading, user } = useAuthStore();
  const onboardingData = useAIPlanStore((s) => s.onboardingData);
  const surveyLevelResult = useAIPlanStore((s) => s.surveyLevelResult);
  const pendingPostSignupIntent = useAIPlanStore((s) => s.pendingPostSignupIntent);
  const pendingPostSignupEmail = useAIPlanStore((s) => s.pendingPostSignupEmail);
  const pendingResumeOnboardingData = useAIPlanStore((s) => s.pendingResumeOnboardingData);
  const pendingResumeSurveyLevelResult = useAIPlanStore((s) => s.pendingResumeSurveyLevelResult);
  const setPendingPostSignupIntent = useAIPlanStore((s) => s.setPendingPostSignupIntent);
  const stashPendingResumeContext = useAIPlanStore((s) => s.stashPendingResumeContext);
  const loginSource = route.params?.source ?? 'default';
  const loginIntent = route.params?.intent ?? pendingPostSignupIntent ?? 'signup_only';

  useEffect(() => {
    if (loginSource !== 'ai-level-result') return;

    if (!pendingPostSignupIntent) {
      setPendingPostSignupIntent(loginIntent);
    }

    if (!pendingResumeOnboardingData && !pendingResumeSurveyLevelResult && onboardingData && surveyLevelResult) {
      stashPendingResumeContext(onboardingData, surveyLevelResult);
    }
  }, [
    loginIntent,
    loginSource,
    onboardingData,
    pendingPostSignupIntent,
    pendingResumeOnboardingData,
    pendingResumeSurveyLevelResult,
    setPendingPostSignupIntent,
    stashPendingResumeContext,
    surveyLevelResult,
  ]);

  useEffect(() => {
    if (!user) return;

    if (loginSource === 'ai-level-result' && pendingPostSignupIntent && !user.isAnonymous) {
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [loginSource, navigation, pendingPostSignupIntent, user]);

  const closeAfterAuth = () => {
    const parentNavigation = navigation.getParent();

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (parentNavigation?.canGoBack()) {
      parentNavigation.goBack();
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      await signIn(email.trim(), password);
      if (loginSource === 'ai-level-result' && navigation.canGoBack()) {
        closeAfterAuth();
        return;
      }

      if (navigation.canGoBack()) {
        closeAfterAuth();
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message ?? '다시 시도해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text variant="headlineMedium" style={styles.title}>FitLog</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>운동과 식단을 한 곳에서</Text>
        {loginSource === 'ai-level-result' ? (
          <Text style={styles.resumeHint}>
            {loginIntent === 'plan'
              ? '이미 계정이 있다면 로그인해서 방금 테스트한 결과로 AI 플랜 받기를 이어갈 수 있어요.'
              : '이미 계정이 있다면 로그인해서 방금 테스트한 결과 화면으로 다시 이어갈 수 있어요.'}
          </Text>
        ) : null}
        {pendingPostSignupIntent ? (
          <Text style={styles.resumeHint}>
            {pendingPostSignupIntent === 'plan'
              ? `로그인하면${pendingPostSignupEmail ? ` ${pendingPostSignupEmail}` : ''} 계정으로 방금 테스트한 결과 기반 AI 플랜 받기를 이어서 진행할 수 있어요.`
              : `로그인하면${pendingPostSignupEmail ? ` ${pendingPostSignupEmail}` : ''} 계정으로 방금 테스트한 결과 화면으로 다시 이어갈 수 있어요.`}
          </Text>
        ) : null}

        <TextInput
          label="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <TextInput
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          right={
            <TextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          로그인
        </Button>

        <Button
          mode="text"
          onPress={() =>
            navigation.navigate('Signup', loginSource === 'ai-level-result'
              ? { source: 'ai-level-result', intent: loginIntent }
              : undefined)
          }
          style={styles.linkButton}
        >
          계정이 없으신가요? 회원가입
        </Button>

        <Button
          mode="text"
          onPress={async () => {
            try {
              await signInAnonymously();
              closeAfterAuth();
            } catch (e: any) {
              Alert.alert('오류', e.message ?? '다시 시도해주세요.');
            }
          }}
          loading={loading}
          disabled={loading}
          style={styles.linkButton}
          textColor="#999"
        >
          게스트로 시작하기
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
  },
  resumeHint: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 28,
    lineHeight: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 12,
  },
});
