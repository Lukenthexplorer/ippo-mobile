import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { api } from '../../src/lib/api'

const C = {
  bg: '#080808', surface: '#111111', surface2: '#161616',
  border: '#1E1E1E', border2: '#2A2A2A',
  text: '#F0F0F0', muted: '#555555', sub: '#888888',
  red: '#E8192C', redDim: '#3D0A0F',
  green: '#22C55E', amber: '#F59E0B',
}

const isWeb = Platform.OS === 'web'

type CheckIn = { readiness_score: number; sleep_quality: number; energy_level: number; muscle_soreness: number }
type Overview = { total_sessions: number; sessions_this_week: number; exercises: { exercise_name: string; last_weight: number; trend: string }[] }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 18) return 'Good afternoon.'
  return 'Good evening.'
}

function readinessColor(s: number) { return s >= 7 ? C.green : s >= 5 ? C.amber : C.red }
function readinessLabel(s: number) {
  if (s >= 8) return 'Peak condition.'
  if (s >= 6) return 'Ready to train.'
  if (s >= 4) return 'Take it easy.'
  return 'Consider resting.'
}
function trendColor(t: string) { return t === 'up' ? C.green : t === 'down' ? C.red : C.muted }
function trendSymbol(t: string) { return t === 'up' ? '↑' : t === 'down' ? '↓' : '→' }

export default function Home() {
  const [checkin, setCheckin] = useState<CheckIn | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)
      const [c, o] = await Promise.allSettled([
        api<CheckIn>('/checkins/latest'),
        api<Overview>('/progress/overview'),
      ])
      if (c.status === 'fulfilled') setCheckin(c.value)
      if (o.status === 'fulfilled') setOverview(o.value)
    } catch (e) {}
    finally { setLoading(false) }
  }

  useFocusEffect(useCallback(() => { loadData() }, []))

  if (loading) return (
    <View style={s.loader}><ActivityIndicator color={C.red} /></View>
  )

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>IPPO</Text>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={s.email}>{email}</Text>
        </View>
        {isWeb && (
          <View style={s.navLinks}>
            {[
              { label: 'Today', route: '/(app)/home' },
              { label: 'Plans', route: '/(app)/plans' },
              { label: 'Train', route: '/(app)/session' },
              { label: 'Progress', route: '/(app)/progress' },
              { label: 'Coach', route: '/(app)/coach' },
            ].map((l, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(l.route as any)}>
                <Text style={s.navLink}>{l.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => supabase.auth.signOut()} style={s.signoutBtn}>
              <Text style={s.signoutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isWeb && (
          <TouchableOpacity onPress={() => supabase.auth.signOut()}>
            <Text style={s.signoutText}>Sign out</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Grid */}
      <View style={[s.grid, isWeb && s.gridWeb]}>

        {/* Readiness */}
        <View style={[s.card, isWeb && s.cardFlex]}>
          <Text style={s.cardLabel}>READINESS</Text>
          {checkin ? (
            <>
              <Text style={[s.bigNum, { color: readinessColor(checkin.readiness_score) }]}>
                {checkin.readiness_score}<Text style={s.bigNumSub}>/10</Text>
              </Text>
              <Text style={s.cardSub}>{readinessLabel(checkin.readiness_score)}</Text>
              <View style={s.divider} />
              <View style={s.row}>
                {[
                  { label: 'Sleep', val: checkin.sleep_quality },
                  { label: 'Energy', val: checkin.energy_level },
                  { label: 'Soreness', val: checkin.muscle_soreness },
                ].map((item, i) => (
                  <View key={i} style={s.statItem}>
                    <Text style={s.statLabel}>{item.label}</Text>
                    <Text style={s.statVal}>{item.val}/10</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={s.ghostBtn} onPress={() => router.push('/(app)/checkin')}>
                <Text style={s.ghostBtnText}>Update check-in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.emptyVal}>—</Text>
              <Text style={s.cardSub}>No check-in today</Text>
              <TouchableOpacity style={s.redBtn} onPress={() => router.push('/(app)/checkin')}>
                <Text style={s.redBtnText}>Check in now →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* This week */}
        <View style={[s.card, isWeb && s.cardFlex]}>
          <Text style={s.cardLabel}>THIS WEEK</Text>
          <Text style={s.bigNum}>
            {overview?.sessions_this_week ?? 0}
            <Text style={s.bigNumSub}> sessions</Text>
          </Text>
          <Text style={s.cardSub}>{overview?.total_sessions ?? 0} total sessions</Text>
          <View style={s.divider} />
          <TouchableOpacity style={s.redBtn} onPress={() => router.push('/(app)/session')}>
            <Text style={s.redBtnText}>Start session →</Text>
          </TouchableOpacity>
        </View>

        {/* Recent exercises */}
        <View style={[s.card, s.cardFull]}>
          <Text style={s.cardLabel}>RECENT EXERCISES</Text>
          {!overview || overview.exercises.length === 0 ? (
            <Text style={s.cardSub}>No exercises logged yet.</Text>
          ) : overview.exercises.map((ex, i) => (
            <View key={i} style={[s.exRow, i < overview.exercises.length - 1 && s.exRowBorder]}>
              <Text style={s.exName}>{ex.exercise_name}</Text>
              <View style={s.row}>
                <Text style={s.exWeight}>{ex.last_weight}kg</Text>
                <Text style={[s.exTrend, { color: trendColor(ex.trend) }]}>{trendSymbol(ex.trend)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={[s.card, s.cardFull]}>
          <Text style={s.cardLabel}>QUICK ACTIONS</Text>
          <View style={[s.actionsGrid, isWeb && s.actionsGridWeb]}>
            {[
              { label: 'Start session', sub: 'Log your training', route: '/(app)/session', red: true },
              { label: 'Check in', sub: 'Log readiness', route: '/(app)/checkin', red: false },
              { label: 'Plans', sub: 'Manage workouts', route: '/(app)/plans', red: false },
              { label: 'Coach', sub: 'Talk to IPPO', route: '/(app)/coach', red: false },
            ].map((a, i) => (
              <TouchableOpacity key={i} style={[s.actionCard, a.red && s.actionCardRed]} onPress={() => router.push(a.route as any)}>
                <Text style={[s.actionTitle, a.red && s.actionTitleRed]}>{a.label}</Text>
                <Text style={[s.actionSub, a.red && s.actionSubRed]}>{a.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  loader: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: isWeb ? 40 : 24, paddingTop: isWeb ? 32 : 64, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 24 },
  logo: { fontSize: 11, fontWeight: '700', color: C.red, letterSpacing: 4, marginBottom: 8 },
  greeting: { fontSize: isWeb ? 28 : 22, fontWeight: '700', color: C.text, marginBottom: 2 },
  email: { fontSize: 12, color: C.muted },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  navLink: { fontSize: 13, color: C.sub },
  signoutBtn: {},
  signoutText: { fontSize: 13, color: C.muted },
  grid: { gap: 12 },
  gridWeb: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.border, marginBottom: 0 },
  cardFlex: { flex: 1, minWidth: 280 },
  cardFull: { width: '100%' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 16 },
  bigNum: { fontSize: 48, fontWeight: '800', color: C.text, marginBottom: 4 },
  bigNumSub: { fontSize: 18, fontWeight: '400', color: C.sub },
  cardSub: { fontSize: 14, color: C.sub, marginBottom: 16 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1 },
  statLabel: { fontSize: 11, color: C.muted, marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: '700', color: C.text },
  emptyVal: { fontSize: 48, fontWeight: '800', color: C.muted, marginBottom: 4 },
  redBtn: { backgroundColor: C.red, borderRadius: 10, padding: 14, alignItems: 'center' },
  redBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ghostBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, alignItems: 'center' },
  ghostBtnText: { fontSize: 14, color: C.sub },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  exName: { fontSize: 14, color: C.text, fontWeight: '500' },
  exWeight: { fontSize: 14, color: C.sub, marginRight: 12 },
  exTrend: { fontSize: 18, fontWeight: '700' },
  actionsGrid: { gap: 10 },
  actionsGridWeb: { flexDirection: 'row', flexWrap: 'wrap' },
  actionCard: { flex: 1, minWidth: isWeb ? 160 : '100%' as any, backgroundColor: C.surface2, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
  actionCardRed: { backgroundColor: C.red, borderColor: C.red },
  actionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  actionTitleRed: { color: '#fff' },
  actionSub: { fontSize: 12, color: C.muted },
  actionSubRed: { color: 'rgba(255,255,255,0.7)' },
})
