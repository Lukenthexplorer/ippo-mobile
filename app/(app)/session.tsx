import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator, Alert
} from 'react-native'
import { api } from '../../src/lib/api'
import { colors } from '../../src/constants/colors'

type Feeling = 'easy' | 'ok' | 'hard' | 'very_hard' | 'failure'
type SetLog = { exercise_name: string; set_number: number; reps_done: number; weight: number; rpe: number; feeling: Feeling }

const FEELINGS: { key: Feeling; label: string; color: string }[] = [
  { key: 'easy', label: 'Easy', color: colors.accent },
  { key: 'ok', label: 'OK', color: colors.text },
  { key: 'hard', label: 'Hard', color: colors.accentWarm },
  { key: 'very_hard', label: 'Very hard', color: colors.accentRed },
  { key: 'failure', label: 'Failure', color: colors.danger },
]

export default function Session() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sets, setSets] = useState<SetLog[]>([])
  const [exercise, setExercise] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rpe, setRpe] = useState(7)
  const [feeling, setFeeling] = useState<Feeling>('ok')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function startSession() {
    setLoading(true)
    try {
      const data = await api<{ id: string }>('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      setSessionId(data.id)
    } catch (e: any) {
      Alert.alert('Erro', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function logSet() {
    if (!sessionId || !exercise || !reps || !weight) {
      Alert.alert('Fill all fields')
      return
    }
    setLoading(true)
    try {
      const setNumber = sets.filter(s => s.exercise_name === exercise).length + 1
      const payload = {
        exercise_name: exercise,
        set_number: setNumber,
        reps_done: parseInt(reps),
        weight: parseFloat(weight),
        rpe,
        feeling,
      }
      await api(`/sessions/${sessionId}/sets`, { method: 'POST', body: JSON.stringify(payload) })
      setSets(prev => [...prev, payload])
      setReps('')
    } catch (e: any) {
      Alert.alert('Erro', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function finishSession() {
    if (!sessionId) return
    setLoading(true)
    try {
      const data = await api(`/sessions/${sessionId}/finish`, { method: 'POST' })
      setResult(data)
    } catch (e: any) {
      Alert.alert('Erro', e.message)
    } finally {
      setLoading(false)
    }
  }

  function resetSession() {
    setSessionId(null)
    setSets([])
    setExercise('')
    setReps('')
    setWeight('')
    setRpe(7)
    setFeeling('ok')
    setResult(null)
  }

  // Resultado final
  if (result) {
    const decisionColor = result.decision === 'increase' ? colors.accent : result.decision === 'decrease' ? colors.accentRed : colors.text
    const decisionLabel = result.decision === 'increase' ? 'Increase load' : result.decision === 'decrease' ? 'Decrease load' : 'Maintain load'
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Session complete.</Text>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>COACH DECISION</Text>
          <Text style={[styles.resultDecision, { color: decisionColor }]}>{decisionLabel}</Text>
          {result.suggested_weight && (
            <Text style={styles.resultWeight}>Next session: {result.suggested_weight} kg</Text>
          )}
          <Text style={styles.resultReason}>{result.reason}</Text>
        </View>
        <View style={styles.resultMeta}>
          <Text style={styles.resultMetaText}>Confidence: {result.confidence}</Text>
          <Text style={styles.resultMetaText}>{sets.length} sets logged</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={resetSession}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // Antes de iniciar
  if (!sessionId) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Train</Text>
          <Text style={styles.subtitle}>Ready to work?</Text>
          <TouchableOpacity style={styles.button} onPress={startSession} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Start session</Text>}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Sessão ativa
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Session active</Text>
      <Text style={styles.subtitle}>{sets.length} sets logged</Text>

      {sets.length > 0 && (
        <View style={styles.setsLog}>
          {sets.slice(-3).map((s, i) => (
            <View key={i} style={styles.setRow}>
              <Text style={styles.setExercise}>{s.exercise_name}</Text>
              <Text style={styles.setDetail}>{s.reps_done} reps · {s.weight}kg · RPE {s.rpe}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          placeholder="Exercise name"
          placeholderTextColor={colors.textTertiary}
          value={exercise}
          onChangeText={setExercise}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Reps"
            placeholderTextColor={colors.textTertiary}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Weight (kg)"
            placeholderTextColor={colors.textTertiary}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.fieldLabel}>RPE: {rpe}</Text>
        <View style={styles.scaleRow}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.scaleButton, rpe === n && styles.scaleButtonActive]}
              onPress={() => setRpe(n)}
            >
              <Text style={[styles.scaleButtonText, rpe === n && styles.scaleButtonTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Feeling</Text>
        <View style={styles.feelingRow}>
          {FEELINGS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.feelingButton, feeling === f.key && { borderColor: f.color }]}
              onPress={() => setFeeling(f.key)}
            >
              <Text style={[styles.feelingText, feeling === f.key && { color: f.color }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logButton} onPress={logSet} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>Log set</Text>}
        </TouchableOpacity>
      </View>

      {sets.length > 0 && (
        <TouchableOpacity style={styles.finishButton} onPress={finishSession}>
          <Text style={styles.finishButtonText}>Finish session</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 64 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
  setsLog: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  setRow: { marginBottom: 8 },
  setExercise: { fontSize: 14, fontWeight: '600', color: colors.text },
  setDetail: { fontSize: 13, color: colors.textSecondary },
  inputCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, fontSize: 16, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, marginTop: 4 },
  scaleRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  scaleButton: { flex: 1, aspectRatio: 1, borderRadius: 6, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  scaleButtonActive: { backgroundColor: colors.text, borderColor: colors.text },
  scaleButtonText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
  scaleButtonTextActive: { color: colors.background },
  feelingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  feelingButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  feelingText: { fontSize: 13, fontWeight: '500', color: colors.textTertiary },
  logButton: { backgroundColor: colors.text, borderRadius: 10, padding: 16, alignItems: 'center' },
  button: { backgroundColor: colors.text, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 16 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
  finishButton: { borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: colors.border },
  finishButtonText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  resultCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  resultLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, letterSpacing: 1, marginBottom: 8 },
  resultDecision: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  resultWeight: { fontSize: 16, color: colors.textSecondary, marginBottom: 12 },
  resultReason: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  resultMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultMetaText: { fontSize: 13, color: colors.textTertiary },
})