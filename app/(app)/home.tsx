import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { api } from '../../src/lib/api'
import { colors } from '../../src/constants/colors'

type CheckIn = {
  readiness_score: number
  sleep_quality: number
  energy_level: number
  muscle_soreness: number
  created_at: string
}

type Overview = {
  total_sessions: number
  sessions_this_week: number
  exercises: { exercise_name: string; last_weight: number; trend: string }[]
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 18) return 'Good afternoon.'
  return 'Good evening.'
}

function readinessColor(score: number) {
  if (score >= 7) return colors.accent
  if (score >= 5) return colors.accentWarm
  return colors.accentRed
}

function readinessLabel(score: number) {
  if (score >= 8) return 'Great shape.'
  if (score >= 6) return 'Ready to train.'
  if (score >= 4) return 'Take it easy today.'
  return 'Consider resting.'
}

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

      const [checkinData, overviewData] = await Promise.allSettled([
        api<CheckIn>('/checkins/latest'),
        api<Overview>('/progress/overview'),
      ])

      if (checkinData.status === 'fulfilled') setCheckin(checkinData.value)
      if (overviewData.status === 'fulfilled') setOverview(overviewData.value)
    } catch (e) {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  // Recarrega quando a tela ganha foco (volta do check-in, sessão etc)
  useFocusEffect(useCallback(() => { loadData() }, []))

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.text} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Readiness card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>READINESS</Text>
            {checkin ? (
              <>
                <Text style={[styles.readinessScore, { color: readinessColor(checkin.readiness_score) }]}>
                  {checkin.readiness_score}/10
                </Text>
                <Text style={styles.readinessLabel}>{readinessLabel(checkin.readiness_score)}</Text>
                <View style={styles.readinessDetails}>
                  <View style={styles.readinessItem}>
                    <Text style={styles.readinessItemLabel}>Sleep</Text>
                    <Text style={styles.readinessItemValue}>{checkin.sleep_quality}/10</Text>
                  </View>
                  <View style={styles.readinessItem}>
                    <Text style={styles.readinessItemLabel}>Energy</Text>
                    <Text style={styles.readinessItemValue}>{checkin.energy_level}/10</Text>
                  </View>
                  <View style={styles.readinessItem}>
                    <Text style={styles.readinessItemLabel}>Soreness</Text>
                    <Text style={styles.readinessItemValue}>{checkin.muscle_soreness}/10</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.cardValue}>—</Text>
                <Text style={styles.cardSub}>No check-in today</Text>
                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => router.push('/(app)/checkin')}
                >
                  <Text style={styles.cardButtonText}>Check in now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Sessão card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>THIS WEEK</Text>
            <Text style={styles.cardValue}>
              {overview?.sessions_this_week ?? 0}
              <Text style={styles.cardValueSub}> sessions</Text>
            </Text>
            {overview && overview.exercises.length > 0 && (
              <View style={styles.lastExercises}>
                {overview.exercises.slice(0, 3).map((ex, i) => (
                  <View key={i} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
                    <Text style={[
                      styles.exerciseTrend,
                      { color: ex.trend === 'up' ? colors.accent : ex.trend === 'down' ? colors.accentRed : colors.textTertiary }
                    ]}>
                      {ex.trend === 'up' ? '↑' : ex.trend === 'down' ? '↓' : '→'} {ex.last_weight}kg
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.cardButton, styles.cardButtonPrimary]}
              onPress={() => router.push('/(app)/session')}
            >
              <Text style={[styles.cardButtonText, styles.cardButtonTextPrimary]}>Start session</Text>
            </TouchableOpacity>
          </View>

          {/* Check-in rápido se já tem */}
          {checkin && (
            <TouchableOpacity
              style={styles.recheckButton}
              onPress={() => router.push('/(app)/checkin')}
            >
              <Text style={styles.recheckButtonText}>Update check-in</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 64, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  greeting: { fontSize: 28, fontWeight: '600', color: colors.text },
  email: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  signout: { fontSize: 14, color: colors.textTertiary, marginTop: 6 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, letterSpacing: 1, marginBottom: 8 },
  cardValue: { fontSize: 36, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardValueSub: { fontSize: 18, fontWeight: '400', color: colors.textSecondary },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  cardButton: { borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: 16 },
  cardButtonPrimary: { backgroundColor: colors.text, borderColor: colors.text },
  cardButtonText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  cardButtonTextPrimary: { color: colors.background },
  readinessScore: { fontSize: 48, fontWeight: '700', marginBottom: 4 },
  readinessLabel: { fontSize: 15, color: colors.textSecondary, marginBottom: 16 },
  readinessDetails: { flexDirection: 'row', gap: 0, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  readinessItem: { flex: 1, alignItems: 'center' },
  readinessItemLabel: { fontSize: 11, color: colors.textTertiary, marginBottom: 4 },
  readinessItemValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  lastExercises: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 8, gap: 8 },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 14, color: colors.textSecondary },
  exerciseTrend: { fontSize: 14, fontWeight: '600' },
  recheckButton: { padding: 14, alignItems: 'center' },
  recheckButtonText: { fontSize: 14, color: colors.textTertiary },
})