import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { AuthStackParamList, RootStackParamList } from '../../types/navigation';

type SignupNavParamList = AuthStackParamList & RootStackParamList;

function validateSignupPassword(password: string) {
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return {
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    isValid: hasMinLength && hasLowercase && hasUppercase && hasNumber,
  };
}

function toFriendlySignupError(error: unknown) {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  if (message.includes('Password should contain at least one character of')) {
    return '비밀번호는 8자 이상이며 영문 소문자, 대문자, 숫자를 각각 1개 이상 포함해야 합니다.';
  }

  return message || '다시 시도해주세요.';
}

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SignupNavParamList, 'Signup'>>();
  const route = useRoute<RouteProp<SignupNavParamList, 'Signup'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { signUp, loading } = useAuthStore();
  const setPendingPostSignupEmail = useAIPlanStore((s) => s.setPendingPostSignupEmail);
  const onboardingData = useAIPlanStore((s) => s.onboardingData);
  const surveyLevelResult = useAIPlanStore((s) => s.surveyLevelResult);
  const stashPendingResumeContext = useAIPlanStore((s) => s.stashPendingResumeContext);
  const signupSource = route.params?.source ?? 'default';
  const signupIntent = route.params?.intent ?? 'signup_only';

  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const passwordValidation = validateSignupPassword(password);

  const logSignupDebug = (message: string, payload?: Record<string, unknown>) => {
    console.log(`[signup-debug] ${message}`, payload ?? {});
  };

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      logSignupDebug('validation:missing_fields', {
        hasEmail: Boolean(email.trim()),
        hasPassword: Boolean(password),
      });
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (!passwordValidation.isValid) {
      logSignupDebug('validation:weak_password', {
        email: email.trim(),
        passwordLength: password.length,
        hasMinLength: passwordValidation.hasMinLength,
        hasLowercase: passwordValidation.hasLowercase,
        hasUppercase: passwordValidation.hasUppercase,
        hasNumber: passwordValidation.hasNumber,
      });
      Alert.alert(
        '입력 오류',
        '비밀번호는 8자 이상이며 영문 소문자, 대문자, 숫자를 각각 1개 이상 포함해야 합니다.'
      );
      return;
    }
    if (password !== passwordConfirm) {
      logSignupDebug('validation:password_mismatch', {
        email: email.trim(),
      });
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const normalizedEmail = email.trim();
      logSignupDebug('submit:start', {
        email: normalizedEmail,
        signupSource,
        signupIntent,
      });
      if (signupSource === 'ai-level-result' && onboardingData && surveyLevelResult) {
        stashPendingResumeContext(onboardingData, surveyLevelResult);
      }
      setPendingPostSignupEmail(signupSource === 'ai-level-result' ? normalizedEmail : null);
      const result = await signUp(normalizedEmail, password);
      const completionMessage =
        signupSource === 'ai-level-result'
          ? result.mode === 'anonymous_upgrade'
            ? signupIntent === 'plan'
              ? '계정 연결을 요청했어요. 바로 이어질 수 있고, 설정에 따라 이메일 확인이 필요할 수도 있어요.'
              : '계정 연결을 요청했어요. 필요하면 이메일 확인 후 다시 돌아와 이어서 이용할 수 있어요.'
            : signupIntent === 'plan'
              ? '확인 이메일을 발송했습니다. 이메일 확인 후 로그인하면 AI 플랜 받기를 이어서 진행할 수 있어요.'
              : '확인 이메일을 발송했습니다. 이메일 확인 후 로그인해서 이어서 이용할 수 있어요.'
            : '확인 이메일을 발송했습니다. 이메일을 확인해주세요.';
      logSignupDebug('submit:success', {
        email: normalizedEmail,
        mode: result.mode,
        signupSource,
        signupIntent,
        completionMessage,
      });
      Alert.alert(
        '가입 완료',
        completionMessage,
        [{
          text: '확인',
          onPress: () => {
            logSignupDebug('submit:success_alert_confirm', {
              email: normalizedEmail,
              signupSource,
              signupIntent,
              navigationAction: signupSource === 'ai-level-result' ? 'goBack' : 'navigate:Login',
            });
            if (signupSource === 'ai-level-result') {
              navigation.goBack();
              return;
            }
            navigation.navigate('Login');
          },
        }]
      );
    } catch (e: any) {
      setPendingPostSignupEmail(null);
      logSignupDebug('submit:error', {
        email: email.trim(),
        signupSource,
        signupIntent,
        message: e?.message ?? 'unknown error',
        status: e?.status ?? null,
        name: e?.name ?? null,
        code: e?.code ?? null,
      });
      Alert.alert('회원가입 실패', toFriendlySignupError(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text variant="headlineMedium" style={styles.title}>회원가입</Text>
        {signupSource === 'ai-level-result' ? (
          <Text style={styles.subtitle}>
            {signupIntent === 'plan'
              ? '회원가입 후 로그인하면 방금 확인한 결과로 AI 플랜 받기를 이어갈 수 있어요.'
              : '계정을 만들어두면 나중에 다시 돌아와 결과와 기능을 이어서 볼 수 있어요.'}
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
        <TextInput
          label="비밀번호 확인"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry={!passwordVisible}
          error={passwordMismatch}
          style={styles.input}
        />
        <HelperText type="error" visible={passwordMismatch}>
          비밀번호가 일치하지 않습니다.
        </HelperText>
        <HelperText type={password.length > 0 && !passwordValidation.isValid ? 'error' : 'info'} visible>
          비밀번호는 8자 이상, 영문 소문자/대문자/숫자를 각각 1개 이상 포함해야 합니다.
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSignup}
          loading={loading}
          disabled={loading || passwordMismatch || !passwordValidation.isValid}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          가입하기
        </Button>

        <Button
          mode="text"
          onPress={() => {
            if (signupSource === 'ai-level-result') {
              navigation.navigate('Login', {
                source: 'ai-level-result',
                intent: signupIntent,
              });
              return;
            }
            navigation.goBack();
          }}
          style={styles.linkButton}
        >
          {signupSource === 'ai-level-result'
            ? '이미 계정이 있다면 로그인해서 이어가기'
            : '이미 계정이 있으신가요? 로그인'}
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
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    marginBottom: 4,
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
