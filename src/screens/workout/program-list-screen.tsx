import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgramStore } from '../../stores/program-store';
import { useAppTheme } from '../../theme';
import { Program } from '../../types/program';
import { WorkoutStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'ProgramList'>;
};

type Tab = 'explore' | 'mine';

function ProgramCard({
  program,
  onPress,
}: {
  program: Program;
  onPress: () => void;
}) {
  const { colors, typography } = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.md,
            fontWeight: typography.weight.semibold,
            color: colors.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {program.name}
        </Text>
        {program.is_public && (
          <View style={[styles.publicBadge, { backgroundColor: colors.accent + '22' }]}>
            <Text
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: colors.accent,
              }}
            >
              공개
            </Text>
          </View>
        )}
      </View>

      {program.description ? (
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.sm,
            color: colors.textSecondary,
            marginTop: 4,
          }}
          numberOfLines={2}
        >
          {program.description}
        </Text>
      ) : null}

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar-week" size={13} color={colors.textTertiary} />
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.xs,
              color: colors.textTertiary,
              marginLeft: 3,
            }}
          >
            {program.duration_weeks}주
          </Text>
        </View>
        <View style={[styles.metaItem, { marginLeft: 12 }]}>
          <MaterialCommunityIcons name="repeat" size={13} color={colors.textTertiary} />
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.xs,
              color: colors.textTertiary,
              marginLeft: 3,
            }}
          >
            주 {program.days_per_week}일
          </Text>
        </View>
        {program.creator_name && (
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.xs,
              color: colors.textTertiary,
              marginLeft: 'auto',
            }}
          >
            by {program.creator_name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProgramListScreen({ navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { myPrograms, publicPrograms, fetchMyPrograms, fetchPublicPrograms } = useProgramStore();
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMyPrograms(), fetchPublicPrograms()]);
    setLoading(false);
  }, [fetchMyPrograms, fetchPublicPrograms]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const data = activeTab === 'explore' ? publicPrograms : myPrograms;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.xl,
            fontWeight: typography.weight.bold,
            color: colors.text,
            flex: 1,
            marginLeft: 12,
          }}
        >
          프로그램
        </Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('ProgramCreate')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: '#fff',
              marginLeft: 4,
            }}
          >
            만들기
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(['explore', 'mine'] as Tab[]).map((tab) => {
          const label = tab === 'explore' ? '탐색' : '내 프로그램';
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, active && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.size.sm,
                  fontWeight: active ? typography.weight.semibold : typography.weight.regular,
                  color: active ? colors.accent : colors.textSecondary,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProgramCard
              program={item}
              onPress={() => navigation.navigate('ProgramDetail', { programId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={44} color={colors.textTertiary} />
              <Text
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.size.md,
                  color: colors.textSecondary,
                  marginTop: 12,
                  textAlign: 'center',
                }}
              >
                {activeTab === 'explore'
                  ? '공개된 프로그램이 없어요\n첫 번째로 만들어보세요!'
                  : '만든 프로그램이 없어요\n오른쪽 위 버튼으로 만들어보세요!'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
});
