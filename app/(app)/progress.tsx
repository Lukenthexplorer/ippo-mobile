import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { api } from '../../src/lib/api'
import { useLayout } from '../../src/hooks/useLayout'

const C = {
  bg: '#080808', surface: '#111111',
  border: '#1E1E1E', text: '#F0F0F0', muted: '#555555', sub: '#888888',
  red: '#E8192C', green: '#22C55E', amber: '#F59E0B',
}

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

function trendColor(t: string) { return t === 'up' ? C.green : t === 'down' ? C.red : C.muted }
function trendSymbol(t: string) { return t === 'up' ? '↑' : t === 'down' ? '↓' : '→' }
function trendLabel(t: string) { return t === 'up' ? 'Progressing' : t === 'down' ? 'Dropped' : 'Stable' }

export default function Progress() {
  const { isDesktop } = useLayout()
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Overview>('/progress/overview')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <View style={s.loader}><ActivityIndicator color={C.red} /></View>
  )

  return (
    <ScrollView style={s.root} contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
      <Text style={s.pageLabel}>PROGRESS</Text>
      <Text style={s.pageTitle}>Your numbers.</Text>

      {/* Stats row */}
      <View style={[s.statsRow, isDesktop && s.statsRowDesktop]}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>TOTAL SESSIONS</Text>
          <Text style={s.statValue}>{data?.total_sessions ?? 0}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>THIS WEEK</Text>
          <Text style={s.statValue}>{data?.sessions_this_week ?? 0}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>EXERCISES</Text>
          <Text style={s.statValue}>{data?.exercises.length ?? 0}</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* Exercise list */}
      {!data || data.exercises.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No data yet.</Text>
          <Text style={s.emptySub}>Log your first session to start tracking progress.</Text>
        </View>
      ) : (
        <View style={[s.exerciseGrid, isDesktop && s.exerciseGridDesktop]}>
          {data.exercises.map((ex, i) => (
            <View key={i} style={[s.exerciseCard, isDesktop && s.exerciseCardDesktop]}>
              <View style={s.exerciseCardHeader}>
                <Text style={s.exerciseName}>{ex.exercise_name}</Text>
                <View style={[s.trendBadge, { borderColor: trendColor(ex.trend) }]}>
                  <Text style={[s.trendBadgeText, { color: trendColor(ex.trend) }]}>
                    {trendSymbol(ex.trend)} {trendLabel(ex.trend)}
                  </Text>
                </View>
              </View>
              <View style={s.divider} />
              <View style={s.exerciseStats}>
                <View style={s.exerciseStatItem}>
                  <Text style={s.exerciseStatLabel}>LAST</Text>
                  <Text style={s.exerciseStatValue}>{ex.last_weight}kg</Text>
                </View>
                <View style={s.exerciseStatItem}>
                  <Text style={s.exerciseStatLabel}>MAX</Text>
                  <Text style={s.exerciseStatValue}>{ex.max_weight}kg</Text>
                </View>
                <View style={s.exerciseStatItem}>
                  <Text style={s.exerciseStatLabel}>SESSIONS</Text>
                  <Text style={s.exerciseStatValue}>{ex.sessions_count}</Text>
                </View>
                {ex.last_rpe && (
                  <View style={s.exerciseStatItem}>
                    <Text style={s.exerciseStatLabel}>LAST RPE</Text>
                    <Text style={s.exerciseStatValue}>{ex.last_rpe}/10</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  loader: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 24, paddingTop: 48, paddingBottom: 60 },
  contentDesktop: { padding: 40, paddingTop: 40 },
  pageLabel: { fontSize: 10, fontWeight: '700', color: C.red, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { fontSize: 40, fontWeight: '800', color: C.text, marginBottom: 32 },
  statsRow: { gap: 12, marginBottom: 8 },
  statsRowDesktop: { flexDirection: 'row' },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  statLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 8 },
  statValue: { fontSize: 40, fontWeight: '800', color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 24 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center' },
  exerciseGrid: { gap: 12 },
  exerciseGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  exerciseCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  exerciseCardDesktop: { flex: 1, minWidth: 280 },
  exerciseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 16, fontWeight: '700', color: C.text, flex: 1 },
  trendBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  trendBadgeText: { fontSize: 12, fontWeight: '600' },
  exerciseStats: { flexDirection: 'row', gap: 0 },
  exerciseStatItem: { flex: 1 },
  exerciseStatLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 4 },
  exerciseStatValue: { fontSize: 20, fontWeight: '700', color: C.text },
})
