import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LOADING_CARDS, LOADING_STEPS } from '../../constants/ai-loading-content';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AILoadingScreenProps {
  /** API 완료 신호 — true가 되면 onComplete() 즉시 호출 */
  isComplete: boolean;
  /** 결과 화면으로 이동하는 콜백 */
  onComplete: () => void;
}

// ─── 상수 ────────────────────────────────────────────────────────────────────

const CARD_AUTO_INTERVAL = 3000; // ms

// ─── Component ───────────────────────────────────────────────────────────────

export function AILoadingScreen({ isComplete, onComplete }: AILoadingScreenProps) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 380 || height < 760;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const cardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotAnim = useRef(new Animated.Value(0)).current;

  // ─── 1. API 완료 즉시 이동 ────────────────────────────────────────────────
  useEffect(() => {
    if (isComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  // ─── 2. 경과 시간 타이머 (1초마다 tick) ──────────────────────────────────
  useEffect(() => {
    const ticker = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // ─── 3. 경과 시간 → currentStep 계산 ─────────────────────────────────────
  useEffect(() => {
    let nextStep = 0;
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      if (elapsedSeconds >= LOADING_STEPS[i].startAt) {
        nextStep = i;
      }
    }
    setCurrentStep(nextStep);
  }, [elapsedSeconds]);

  // ─── 4. 점점이 애니메이션 (현재 단계) ────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [currentStep, dotAnim]);

  // ─── 5. 카드 자동 전환 ───────────────────────────────────────────────────
  const startCardTimer = () => {
    if (cardTimerRef.current) clearInterval(cardTimerRef.current);
    cardTimerRef.current = setInterval(() => {
      setCurrentCard(c => {
        const next = (c + 1) % LOADING_CARDS.length;
        scrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
        return next;
      });
    }, CARD_AUTO_INTERVAL);
  };

  // cardWidth는 고정값 사용 (ScrollView width = 화면 width - padding)
  // 실제 width는 onLayout으로 받아도 되지만, 여기선 설계 단순화를 위해 flex 기반
  const [cardWidth, setCardWidth] = useState(300);

  useEffect(() => {
    startCardTimer();
    return () => {
      if (cardTimerRef.current) clearInterval(cardTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardWidth]);

  // ─── 6. 스와이프 후 타이머 리셋 ──────────────────────────────────────────
  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    const clamped = Math.max(0, Math.min(idx, LOADING_CARDS.length - 1));
    setCurrentCard(clamped);
    startCardTimer(); // 자동 타이머 리셋 (스와이프와 자동 전환 충돌 방지)
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      {/* 타이틀 */}
      <View style={styles.titleRow}>
        <MaterialCommunityIcons
          name="robot-outline"
          size={isCompact ? 22 : 24}
          color="#FFFFFF"
          style={styles.titleIcon}
        />
        <Text style={[styles.title, isCompact && styles.titleCompact, { marginBottom: 0 }]}>
          AI가 플랜을 만들고 있어요
        </Text>
      </View>
      <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
        잠깐! 앱을 먼저 살펴볼까요?
      </Text>

      {/* Step Progress */}
      <View style={[styles.stepsContainer, isCompact && styles.stepsContainerCompact]}>
        {LOADING_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <View key={index} style={styles.stepRow}>
              <View style={{ width: 28, alignItems: 'center' }}>
                <MaterialCommunityIcons
                  name={(isCompleted ? 'check' : step.icon) as any}
                  size={isCompact ? 16 : 18}
                  color={isCompleted ? '#AAAAAA' : isPending ? '#666666' : '#FFFFFF'}
                />
              </View>
              <View style={styles.stepTextWrap}>
                <Text
                  style={[
                    styles.stepMessage,
                    isCompact && styles.stepMessageCompact,
                    isCompleted && styles.stepDimmed,
                    isPending && styles.stepPending,
                    isActive && styles.stepActive,
                  ]}
                >
                  {step.message}
                </Text>
              </View>
              {isActive && (
                <Animated.Text style={[styles.dots, { opacity: dotAnim }]}>
                  ●●●
                </Animated.Text>
              )}
            </View>
          );
        })}
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* Card Carousel */}
      <View
        style={styles.carouselWrap}
        onLayout={e => setCardWidth(e.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          style={styles.carousel}
        >
          {LOADING_CARDS.map((card, index) => (
            <View key={index} style={[styles.card, isCompact && styles.cardCompact, { width: cardWidth }]}>
              <MaterialCommunityIcons
                name={card.icon as any}
                size={isCompact ? 34 : 40}
                color="#FFFFFF"
                style={styles.cardIcon}
              />
              {card.type === 'tip' && card.category && (
                <Text style={[styles.cardCategory, isCompact && styles.cardCategoryCompact]}>{card.category}</Text>
              )}
              {card.type === 'feature' && (
                <Text style={[styles.cardCategory, isCompact && styles.cardCategoryCompact]}>앱 기능</Text>
              )}
              <Text style={[styles.cardTitle, isCompact && styles.cardTitleCompact]}>{card.title}</Text>
              <Text style={[styles.cardBody, isCompact && styles.cardBodyCompact]}>{card.body}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 페이지 인디케이터 */}
        <View style={styles.dotsRow}>
          {LOADING_CARDS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentCard ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#0F0F0F',
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
  },
  subtitleCompact: {
    marginBottom: 24,
  },

  // Step Progress
  stepsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  stepsContainerCompact: {
    marginBottom: 18,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepMessage: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  stepMessageCompact: {
    fontSize: 14,
    lineHeight: 19,
  },
  stepActive: {
    color: '#A78BFA',
    fontWeight: '700',
  },
  stepDimmed: {
    opacity: 0.4,
    color: '#AAAAAA',
  },
  stepPending: {
    opacity: 0.25,
    color: '#666666',
  },
  dots: {
    fontSize: 8,
    color: '#A78BFA',
    letterSpacing: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginBottom: 20,
  },

  // Card Carousel
  carouselWrap: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  cardCompact: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  cardIcon: {
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 11,
    color: '#A78BFA',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardCategoryCompact: {
    fontSize: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardTitleCompact: {
    fontSize: 16,
  },
  cardBody: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardBodyCompact: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Dot indicators
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#A78BFA',
  },
  dotInactive: {
    backgroundColor: '#333333',
  },
});
