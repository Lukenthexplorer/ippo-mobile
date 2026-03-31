import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Modal
} from 'react-native'
import { api } from '../../src/lib/api'
import { colors } from '../../src/constants/colors'

type Feeling = 'easy' | 'ok' | 'hard' | 'very_hard' | 'failure'

type SetLog = {
  exercise_name: string
  set_number: number
  reps_done: number
  weight: number
  rpe: number
  feeling: Feeling
}

type ExerciseGroup = {
  name: string
  sets: SetLog[]
}

const FEELINGS: { key: Feeling; label: string; color: string }[] = [
  { key: 'easy', label: 'Easy', color: colors.accent },
  { key: 'ok', label: 'OK', color: colors.text },
  { key: 'hard', label: 'Hard', color: colors.accentWarm },
  { key: 'very_hard', label: 'Very hard', color: colors.accentRed },
  { key: 'failure', label: 'Failure', color: colors.danger },
]

function groupByExercise(sets: SetLog[]): ExerciseGroup[] {
  const map: Record<string, SetLog[]> = {}
  for (const s of sets) {
    if (!map[s.exercise_name]) map[s.exercise_name] = []
    map[s.exercise_name].push(s)
  }
  return Object.entries(map).map(([name, sets]) => ({ name, sets }))
}

export default function Session() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sets, setSets] = useState<SetLog[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const [exercise, setExercise] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rpe, setRpe] = useState(7)
  const [feeling, setFeeling] = useState<Feeling>('ok')
  const [modalLoading, setModalLoading] = useState(false)

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

  function openModal(exerciseName?: string) {
    setExercise(exerciseName ?? '')
    setReps('')
    setRpe(7)
    setFeeling('ok')
    setModalVisible(true)
  }

  async function logSet() {
    if (!sessionId || !exercise || !reps || !weight) {
      Alert.alert('Fill all fields')
      return
    }
    setModalLoading(true)
    try {
      const setNumber = sets.filter(s => s.exercise_name === exercise).length + 1
      const payload: SetLog = {
        exercise_name: exercise,
        set_number: setNumber,
        reps_done: parseInt(reps),
        weight: parseFloat(weight),
        rpe,
        feeling,
      }
      await api(`/sessions/${sessionId}/sets`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setSets(prev => [...prev, payload])
      setModalVisible(false)
    } catch (e: any) {
      Alert.alert('Erro', e.message)
    } finally {
      setModalLoading(false)
    }
  }

  function deleteSet(exerciseName: string, setNumber: number) {
    Alert.alert(
      'Remove set',
      `Remove set ${setNumber} of ${exerciseName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSets(prev => {
              const filtered = prev.filter(
                s => !(s.exercise_name === exerciseName && s.set_number === setNumber)
              )
              const counter: Record<string, number> = {}
              return filtered.map(s => {
                if (!counter[s.exercise_name]) counter[s.exercise_name] = 0
                counter[s.exercise_name]++
                return { ...s, set_number: counter[s.exercise_name] }
              })
            })
          }
        }
      ]
    )
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

  if (result) {
    const decisionColor = result.decision === 'increase' ? colors.accent : result.decision === 'decrease' ? colors.accentRed : colors.text
    const decisionLabel = result.decision === 'increase' ? '↑ Increase load' : result.decision === 'decrease' ? '↓ Decrease load' : '→ Maintain load'
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

  if (!sessionId) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.title}>Train</Text>
        <Text style={styles.subtitle}>Ready to work?</Text>
        <TouchableOpacity style={styles.button} onPress={startSession} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.background} />
            : <Text style={styles.buttonText}>Start session</Text>
          }
        </TouchableOpacity>
      </View>
    )
  }

  const groups = groupByExercise(sets)

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Session active</Text>
        <Text style={styles.subtitle}>{sets.length} sets · {groups.length} exercises</Text>

        {groups.map((group, gi) => (
          <View key={gi} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{group.name}</Text>
              <TouchableOpacity
                style={styles.addSetBtn}
                onPress={() => openModal(group.name)}
              >
                <Text style={styles.addSetBtnText}>+ Set</Text>
              </TouchableOpacity>
            </View>
            {group.sets.map((s, si) => (
              <View key={si} style={styles.setRow}>
                <Text style={styles.setNumber}>Set {s.set_number}</Text>
                <Text style={styles.setDetail}>{s.reps_done} reps · {s.weight}kg</Text>
                <Text style={styles.setRpe}>RPE {s.rpe}</Text>
                <Text style={[
                  styles.setFeeling,
                  { color: FEELINGS.find(f => f.key === s.feeling)?.color ?? colors.textTertiary }
                ]}>
                  {FEELINGS.find(f => f.key === s.feeling)?.label}
                </Text>
                <TouchableOpacity onPress={() => deleteSet(s.exercise_name, s.set_number)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.newExerciseBtn} onPress={() => openModal()}>
          <Text style={styles.newExerciseBtnText}>+ New exercise</Text>
        </TouchableOpacity>

        {sets.length > 0 && (
          <TouchableOpacity style={styles.finishButton} onPress={finishSession} disabled={loading}>
            {loading
              ? <ActivityIndicator color={colors.textSecondary} />
              : <Text style={styles.finishButtonText}>Finish session</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log set</Text>

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

            <TouchableOpacity style={styles.logButton} onPress={logSet} disabled={modalLoading}>
              {modalLoading
                ? <ActivityIndicator color={colors.background} />
                : <Text style={styles.buttonText}>Confirm set</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', padding: 24 },
  content: { padding: 24, paddingTop: 64, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 28 },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: colors.text },
  addSetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  addSetBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  setNumber: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, width: 40 },
  setDetail: { fontSize: 13, color: colors.text, flex: 1 },
  setRpe: { fontSize: 12, color: colors.textTertiary },
  setFeeling: { fontSize: 12, fontWeight: '500' },
  deleteBtn: { fontSize: 14, color: colors.textTertiary, paddingHorizontal: 6 },
  newExerciseBtn: { borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginBottom: 12 },
  newExerciseBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  finishButton: { borderRadius: 12, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.borderStrong, marginTop: 4 },
  finishButtonText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  button: { backgroundColor: colors.text, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 16 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
  resultCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  resultLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, letterSpacing: 1, marginBottom: 8 },
  resultDecision: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  resultWeight: { fontSize: 16, color: colors.textSecondary, marginBottom: 12 },
  resultReason: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  resultMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultMetaText: { fontSize: 13, color: colors.textTertiary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },
  input: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, fontSize: 16, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, marginTop: 4 },
  scaleRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  scaleButton: { flex: 1, aspectRatio: 1, borderRadius: 6, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  scaleButtonActive: { backgroundColor: colors.text, borderColor: colors.text },
  scaleButtonText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
  scaleButtonTextActive: { color: colors.background },
  feelingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  feelingButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  feelingText: { fontSize: 13, fontWeight: '500', color: colors.textTertiary },
  logButton: { backgroundColor: colors.text, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 10 },
  cancelButton: { padding: 14, alignItems: 'center' },
  cancelButtonText: { fontSize: 15, color: colors.textTertiary },
})