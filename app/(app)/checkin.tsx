import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { router } from 'expo-router'
import { api } from '../../src/lib/api'
import { colors } from '../../src/constants/colors'

function ScaleSelector({ label, value, onChange }: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <View style={styles.scaleContainer}>
      <Text style={styles.scaleLabel}>{label}</Text>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.scaleButton, value === n && styles.scaleButtonActive]}
            onPress={() => onChange(n)}
          >
            <Text style={[styles.scaleButtonText, value === n && styles.scaleButtonTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default function CheckIn() {
  const [sleep, setSleep] = useState(7)
  const [energy, setEnergy] = useState(7)
  const [soreness, setSoreness] = useState(3)
  const [loading, setLoading] = useState(false)

  const readiness = Math.round((sleep + energy + (10 - soreness)) / 3)

  async function handleSubmit() {
    setLoading(true)
    try {
      await api('/checkins/', {
        method: 'POST',
        body: JSON.stringify({
          sleep_quality: sleep,
          energy_level: energy,
          muscle_soreness: soreness,
        }),
      })
      router.back()
    } catch (e: any) {
      Alert.alert('Erro', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Check-in</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      <ScaleSelector label="Sleep quality" value={sleep} onChange={setSleep} />
      <ScaleSelector label="Energy level" value={energy} onChange={setEnergy} />
      <ScaleSelector label="Muscle soreness" value={soreness} onChange={setSoreness} />

      <View style={styles.readinessCard}>
        <Text style={styles.readinessLabel}>READINESS SCORE</Text>
        <Text style={[
          styles.readinessValue,
          { color: readiness >= 7 ? colors.accent : readiness >= 5 ? colors.accentWarm : colors.accentRed }
        ]}>
          {readiness}/10
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color={colors.background} />
          : <Text style={styles.buttonText}>Confirm check-in</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 64 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 40 },
  scaleContainer: { marginBottom: 32 },
  scaleLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 12, letterSpacing: 0.5 },
  scaleRow: { flexDirection: 'row', gap: 6 },
  scaleButton: {
    flex: 1, aspectRatio: 1, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  scaleButtonActive: { backgroundColor: colors.text, borderColor: colors.text },
  scaleButtonText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },
  scaleButtonTextActive: { color: colors.background },
  readinessCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 32,
  },
  readinessLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, letterSpacing: 1, marginBottom: 8 },
  readinessValue: { fontSize: 48, fontWeight: '700' },
  button: {
    backgroundColor: colors.text, borderRadius: 12,
    padding: 18, alignItems: 'center',
  },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
})