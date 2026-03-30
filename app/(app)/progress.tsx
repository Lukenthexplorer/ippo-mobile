import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { api } from '../../src/lib/api'
import { colors } from '../../src/constants/colors'

type ExerciseProgress = {
  exercise_name: string
  sessions_count: number
  max_weight: number
  last_weight: number
  last_rpe: number | null
  trend: 'up' | 'down' | 'stable'
}

type Overview = {
  total_sessions: number
  sessions_this_week: number
  exercises: ExerciseProgress[]
}

export default function Progress() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Overview>('/progress/overview')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.text} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Progress</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.total_sessions ?? 0}</Text>
          <Text style={styles.statLabel}>Total sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.sessions_this_week ?? 0}</Text>
          <Text style={styles.statLabel}>This week</Text>
        </View>
      </View>

      {data?.exercises.length === 0 && (
        <Text style={styles.empty}>No data yet. Log your first session.</Text>
      )}

      {data?.exercises.map((ex, i) => (
        <View key={i} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
            <Text style={[
              styles.trend,
              { color: ex.trend === 'up' ? colors.accent : ex.trend === 'down' ? colors.accentRed : colors.textTertiary }
            ]}>
              {ex.trend === 'up' ? '↑' : ex.trend === 'down' ? '↓' : '→'}
            </Text>
          </View>
          <View style={styles.exerciseStats}>
            <Text style={styles.exerciseStat}>Last: {ex.last_weight}kg</Text>
            <Text style={styles.exerciseStat}>Max: {ex.max_weight}kg</Text>
            <Text style={styles.exerciseStat}>{ex.sessions_count} sessions</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 64 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 36, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  empty: { fontSize: 15, color: colors.textTertiary, textAlign: 'center', marginTop: 48 },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: colors.text },
  trend: { fontSize: 20, fontWeight: '700' },
  exerciseStats: { flexDirection: 'row', gap: 16 },
  exerciseStat: { fontSize: 13, color: colors.textSecondary },
})