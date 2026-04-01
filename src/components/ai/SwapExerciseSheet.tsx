import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '../../theme';
import { findAlternatives } from '../../lib/exercise-alternatives';

interface SwapExerciseSheetProps {
  exerciseName: string;
  visible: boolean;
  onSelect: (newName: string) => void;
  onClose: () => void;
  onPressCustomSelect?: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

export function SwapExerciseSheet({
  exerciseName,
  visible,
  onSelect,
  onClose,
  onPressCustomSelect,
  colors,
}: SwapExerciseSheetProps) {
  const { similar, alternatives } = findAlternatives(exerciseName);
  const allAlts = [...similar, ...alternatives];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
                maxHeight: '70%',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              />

              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {exerciseName} 대체 종목
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginBottom: 16,
                }}
              >
                비슷한 근육을 사용하는 종목을 선택하세요
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {similar.length > 0 && (
                  <>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.textSecondary,
                        marginBottom: 8,
                      }}
                    >
                      유사 종목
                    </Text>
                    {similar.map((name) => (
                      <TouchableOpacity
                        key={name}
                        onPress={() => onSelect(name)}
                        style={{
                          paddingVertical: 14,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.separator,
                        }}
                      >
                        <Text style={{ fontSize: 16, color: colors.text }}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {alternatives.length > 0 && (
                  <>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.textSecondary,
                        marginTop: 16,
                        marginBottom: 8,
                      }}
                    >
                      다른 종목으로 변경
                    </Text>
                    {alternatives.map((name) => (
                      <TouchableOpacity
                        key={name}
                        onPress={() => onSelect(name)}
                        style={{
                          paddingVertical: 14,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.separator,
                        }}
                      >
                        <Text style={{ fontSize: 16, color: colors.text }}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {allAlts.length === 0 && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      textAlign: 'center',
                      paddingVertical: 24,
                    }}
                  >
                    이 종목의 대체 운동 정보가 없습니다
                  </Text>
                )}
              </ScrollView>

              {onPressCustomSelect && (
                <TouchableOpacity
                  onPress={onPressCustomSelect}
                  style={[
                    styles.customSelectButton,
                    { borderColor: colors.accent, backgroundColor: colors.accent + '10' },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.customSelectButtonText, { color: colors.accent }]}>
                    직접 운동 선택
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                style={{ alignItems: 'center', paddingVertical: 16 }}
              >
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  customSelectButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 16,
  },
  customSelectButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
