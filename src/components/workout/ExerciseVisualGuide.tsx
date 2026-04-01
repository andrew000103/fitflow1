import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import { useExerciseHistory } from '../../hooks/use-exercise-history';
import ExerciseHistoryPanel from './ExerciseHistoryPanel';

export const isYoutubeUrl = (url: string): boolean =>
  url.includes('youtube.com') || url.includes('youtu.be');

export const getYoutubeThumbnail = (url: string): string => {
  const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop() || '';
  return `https://img.youtube.com/vi/${videoId}/0.jpg`;
};

export const getThumbnailUri = (url: string): string =>
  isYoutubeUrl(url) ? getYoutubeThumbnail(url) : url;

interface ExerciseVisualGuideProps {
  exerciseId?: string;
  visualGuideUrl?: string;
  description?: string;
  exerciseName?: string;
  overview?: string;
  why?: string;
  how?: string;
  triggerVariant?: 'thumbnail' | 'icon';
  iconColor?: string;
  iconBackgroundColor?: string;
  iconBorderColor?: string;
}

interface GuideSections {
  overview?: string;
  why?: string;
  how?: string[];
}

function parseLegacyDescription(description?: string): GuideSections {
  if (!description) return {};

  const trimmed = description.trim();
  if (!trimmed) return {};

  const overviewMatch = trimmed.match(
    /(?:^|\n)(?:개요|Overview)\n([\s\S]*?)(?=\n(?:왜 하나요\?|Why do this exercise\?)\n|$)/,
  );
  const whyMatch = trimmed.match(
    /(?:^|\n)(?:왜 하나요\?|Why do this exercise\?)\n([\s\S]*?)(?=\n(?:수행 방법|How to do it)\n|$)/,
  );
  const howMatch = trimmed.match(
    /(?:^|\n)(?:수행 방법|How to do it)\n([\s\S]*)$/,
  );

  const howSteps = howMatch?.[1]
    ?.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+\.\s*/, ''));

  if (overviewMatch || whyMatch || howMatch) {
    return {
      overview: overviewMatch?.[1]?.trim(),
      why: whyMatch?.[1]?.trim(),
      how: howSteps?.length ? howSteps : undefined,
    };
  }

  return { overview: trimmed };
}

const ExerciseVisualGuide: React.FC<ExerciseVisualGuideProps> = ({
  exerciseId,
  visualGuideUrl,
  description,
  exerciseName,
  overview,
  why,
  how,
  triggerVariant = 'thumbnail',
  iconColor = '#fff',
  iconBackgroundColor = 'rgba(255,255,255,0.12)',
  iconBorderColor = 'rgba(255,255,255,0.18)',
}) => {
  const { colors, typography } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [gifLoading, setGifLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'guide' | 'history'>('guide');

  const sections = useMemo(() => {
    const legacy = parseLegacyDescription(description);
    return {
      overview: overview ?? legacy.overview,
      why: why ?? legacy.why,
      how: how
        ? how
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        : legacy.how,
    };
  }, [description, how, overview, why]);

  const history = useExerciseHistory(exerciseId, modalVisible);
  const hasGuideContent =
    !!visualGuideUrl || !!sections.overview || !!sections.why || !!sections.how?.length;
  const hasHistoryAccess = !!exerciseId;

  if (!hasGuideContent && !hasHistoryAccess) {
    return null;
  }

  const isYoutube = visualGuideUrl ? isYoutubeUrl(visualGuideUrl) : false;
  const thumbnailUri = visualGuideUrl ? getThumbnailUri(visualGuideUrl) : null;

  const handleOpenYoutube = () => {
    if (!visualGuideUrl) return;
    Linking.openURL(visualGuideUrl);
  };

  const handleOpenModal = () => {
    setActiveTab('guide');
    setGifLoading(true);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setActiveTab('guide');
  };

  const tabs: Array<{ key: 'guide' | 'history'; label: string }> = [
    { key: 'guide', label: 'Guide' },
    { key: 'history', label: 'History' },
  ];

  return (
    <>
      <TouchableOpacity
        onPress={(event) => {
          event.stopPropagation?.();
          handleOpenModal();
        }}
        activeOpacity={0.8}
        style={styles.thumbnailWrapper}
      >
        {triggerVariant === 'icon' ? (
          <View
            style={[
              styles.iconTrigger,
              {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
              },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={15}
              color={iconColor}
            />
          </View>
        ) : thumbnailUri ? (
          <>
            <Image
              source={{ uri: thumbnailUri }}
              style={isYoutube ? styles.youtubeThumbnail : styles.gifThumbnail}
              resizeMode="cover"
            />
            <View style={styles.playOverlay}>
              <View style={styles.playIcon} />
            </View>
          </>
        ) : (
          <View style={styles.textOnlyTrigger}>
            <Text style={styles.textOnlyTriggerLabel}>운동 가이드 보기</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                {
                  fontFamily: typography.fontFamily,
                },
              ]}
              numberOfLines={1}
            >
              {exerciseName ?? ''}
            </Text>
            <TouchableOpacity
              onPress={handleCloseModal}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text
                style={[
                  styles.closeButton,
                  {
                    fontFamily: typography.fontFamily,
                  },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                  style={styles.tabButton}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        fontFamily: typography.fontFamily,
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.48)',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabIndicator,
                      {
                        backgroundColor: isActive ? '#fff' : 'transparent',
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'guide' ? (
              <>
                {thumbnailUri ? (
                  isYoutube ? (
                    <View style={styles.youtubeModalSection}>
                      <Image
                        source={{ uri: thumbnailUri }}
                        style={styles.youtubeModalThumbnail}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.youtubeButton}
                        onPress={handleOpenYoutube}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.youtubeButtonText,
                            {
                              fontFamily: typography.fontFamily,
                            },
                          ]}
                        >
                          YouTube에서 보기 →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.gifModalSection}>
                      {gifLoading && (
                        <ActivityIndicator
                          size="large"
                          color="#fff"
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Image
                        source={{ uri: visualGuideUrl }}
                        style={styles.gifModal}
                        resizeMode="contain"
                        onLoadEnd={() => setGifLoading(false)}
                      />
                    </View>
                  )
                ) : null}

                {sections.overview ? (
                  <View style={styles.guideCard}>
                    <Text
                      style={[
                        styles.guideCardTitle,
                        {
                          fontFamily: typography.fontFamily,
                        },
                      ]}
                    >
                      개요
                    </Text>
                    <Text
                      style={[
                        styles.guideCardBody,
                        {
                          fontFamily: typography.fontFamily,
                        },
                      ]}
                    >
                      {sections.overview}
                    </Text>
                  </View>
                ) : null}

                {sections.why ? (
                  <View style={styles.guideCard}>
                    <Text
                      style={[
                        styles.guideCardTitle,
                        {
                          fontFamily: typography.fontFamily,
                        },
                      ]}
                    >
                      왜 하나요?
                    </Text>
                    <Text
                      style={[
                        styles.guideCardBody,
                        {
                          fontFamily: typography.fontFamily,
                        },
                      ]}
                    >
                      {sections.why}
                    </Text>
                  </View>
                ) : null}

                {sections.how?.length ? (
                  <View style={styles.guideCard}>
                    <Text
                      style={[
                        styles.guideCardTitle,
                        {
                          fontFamily: typography.fontFamily,
                        },
                      ]}
                    >
                      수행 방법
                    </Text>
                    {sections.how.map((step, index) => (
                      <Text
                        key={`${step}-${index}`}
                        style={[
                          styles.guideStep,
                          {
                            fontFamily: typography.fontFamily,
                          },
                        ]}
                      >
                        {index + 1}. {step}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {!hasGuideContent ? (
                  <View style={[styles.guideCard, { backgroundColor: colors.card }]}>
                    <Text
                      style={[
                        styles.guideCardTitle,
                        {
                          fontFamily: typography.fontFamily,
                          color: colors.text,
                        },
                      ]}
                    >
                      가이드를 준비 중이에요
                    </Text>
                    <Text
                      style={[
                        styles.guideCardBody,
                        {
                          fontFamily: typography.fontFamily,
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      이 운동은 설명 데이터가 아직 충분하지 않지만, History 탭에서 이전 수행 기록은 확인할 수 있어요.
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <ExerciseHistoryPanel
                loading={history.loading}
                error={history.error}
                sessions={history.sessions}
                summary={history.summary}
                exerciseName={exerciseName}
                isLocalExercise={exerciseId?.startsWith('local::') ?? false}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  thumbnailWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  youtubeThumbnail: {
    width: 100,
    height: 56,
    borderRadius: 8,
  },
  gifThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(255,255,255,0.9)',
    marginLeft: 3,
  },
  textOnlyTrigger: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  textOnlyTriggerLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  iconTrigger: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginRight: 12,
  },
  closeButton: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  tabButton: {
    marginRight: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  tabIndicator: {
    marginTop: 10,
    height: 3,
    borderRadius: 999,
  },
  modalContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 14,
  },
  youtubeModalSection: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  youtubeModalThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  youtubeButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  youtubeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  gifModalSection: {
    minHeight: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifModal: {
    width: '100%',
    height: 320,
  },
  guideCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#f3f3f3',
  },
  guideCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 12,
  },
  guideCardBody: {
    fontSize: 15,
    lineHeight: 25,
    color: '#545454',
  },
  guideStep: {
    fontSize: 15,
    lineHeight: 25,
    color: '#545454',
    marginBottom: 10,
  },
});

export default ExerciseVisualGuide;
