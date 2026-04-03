import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Modal
} from 'react-native'
import { api } from '../../src/lib/api'
import { useLayout } from '../../src/hooks/useLayout'

const C = {
  bg: '#080808', surface: '#111111', surface2: '#181818',
  border: '#1E1E1E', borderStrong: '#2E2E2E',
  text: '#F0F0F0', muted: '#555555', sub: '#888888',
  red: '#E8192C', green: '#22C55E', amber: '#F59E0B', danger: '#F87171',
}

type Feeling = 'easy' | 'ok' | 'hard' | 'very_hard' | 'failure'
type SetLog = { exercise_name: string; set_number: number; reps_done: number; weight: number; rpe: number; feeling: Feeling }
type ExerciseGroup = { name: string; sets: SetLog[] }

const FEELINGS: { key: Feeling; label: string; color: string }[] = [
  { key: 'easy', label: 'Easy', color: C.green },
  { key: 'ok', label: 'OK', color: C.text },
  { key: 'hard', label: 'Hard', color: C.amber },
  { key: 'very_hard', label: 'Very hard', color: C.red },
  { key: 'failure', label: 'Failure', color: C.danger },
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
  const { isDesktop } = useLayout()
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
      const data = await api<{ id: string }>('/sessions/start', { method: 'POST', body: JSON.stringify({}) })
      setSessionId(data.id)
    } catch (e: any) { Alert.alert('Erro', e.message) }
    finally { setLoading(false) }
  }

  function openModal(exerciseName?: string) {
    setExercise(exerciseName ?? '')
    setReps('')
    setRpe(7)
    setFeeling('ok')
    setModalVisible(true)
  }

  async function logSet() {
    if (!sessionId || !exercise || !reps || !weight) { Alert.alert('Fill all fields'); return }
    setModalLoading(true)
    try {
      const setNumber = sets.filter(s => s.exercise_name === exercise).length + 1
      const payload: SetLog = { exercise_name: exercise, set_number: setNumber, reps_done: parseInt(reps), weight: parseFloat(weight), rpe, feeling }
      await api(`/sessions/${sessionId}/sets`, { method: 'POST', body: JSON.stringify(payload) })
      setSets(prev => [...prev, payload])
      setModalVisible(false)
    } catch (e: any) { Alert.alert('Erro', e.message) }
    finally { setModalLoading(false) }
  }

  function deleteSet(exerciseName: string, setNumber: number) {
    Alert.alert('Remove set', `Remove set ${setNumber} of ${exerciseName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setSets(prev => {
          const filtered = prev.filter(s => !(s.exercise_name === exerciseName && s.set_number === setNumber))
          const counter: Record<string, number> = {}
          return filtered.map(s => { if (!counter[s.exercise_name]) counter[s.exercise_name] = 0; counter[s.exercise_name]++; return { ...s, set_number: counter[s.exercise_name] } })
        })
      }}
    ])
  }

  async function finishSession() {
    if (!sessionId) return
    setLoading(true)
    try { const data = await api(`/sessions/${sessionId}/finish`, { method: 'POST' }); setResult(data) }
    catch (e: any) { Alert.alert('Erro', e.message) }
    finally { setLoading(false) }
  }

  function resetSession() {
    setSessionId(null); setSets([]); setExercise(''); setReps(''); setWeight(''); setRpe(7); setFeeling('ok'); setResult(null)
  }

  if (result) {
    const decisionColor = result.decision === 'increase' ? C.green : result.decision === 'decrease' ? C.red : C.text
    const decisionLabel = result.decision === 'increase' ? '↑ Increase load' : result.decision === 'decrease' ? '↓ Decrease load' : '→ Maintain load'
    return (
      <ScrollView style={s.root} contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
        <View style={[s.resultWrap, isDesktop && s.resultWrapDesktop]}>
          <Text style={s.pageLabel}>SESSION COMPLETE</Text>
          <Text style={s.pageTitle}>Done.</Text>
          <View style={s.resultCard}>
            <Text style={s.cardLabel}>COACH DECISION</Text>
            <Text style={[s.decisionText, { color: decisionColor }]}>{decisionLabel}</Text>
            {result.suggested_weight && <Text style={s.suggestedWeight}>Next session: {result.suggested_weight}kg</Text>}
            <View style={s.divider} />
            <Text style={s.reasonText}>{result.reason}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaText}>Confidence: {result.confidence}</Text>
            <Text style={s.metaText}>{sets.length} sets logged</Text>
          </View>
          <TouchableOpacity style={s.redBtn} onPress={resetSession}>
            <Text style={s.redBtnText}>Done →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  if (!sessionId) {
    return (
      <View style={[s.root, s.startWrap]}>
        <View style={[s.startInner, isDesktop && s.startInnerDesktop]}>
          <Text style={s.pageLabel}>TRAINING</Text>
          <Text style={s.pageTitle}>Ready to{'\n'}work?</Text>
          <View style={s.divider} />
          <Text style={s.startSub}>Log your sets, track your progress, get coached.</Text>
          <TouchableOpacity style={s.redBtn} onPress={startSession} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.redBtnText}>Start session →</Text>}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const groups = groupByExercise(sets)

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
        <View style={s.sessionHeader}>
          <View>
            <Text style={s.pageLabel}>SESSION ACTIVE</Text>
            <Text style={s.pageTitle}>{sets.length} sets · {groups.length} exercises</Text>
          </View>
          {sets.length > 0 && (
            <TouchableOpacity style={s.finishBtn} onPress={finishSession} disabled={loading}>
              {loading ? <ActivityIndicator color={C.sub} size="small" /> : <Text style={s.finishBtnText}>Finish</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={[s.exercisesGrid, isDesktop && s.exercisesGridDesktop]}>
          {groups.map((group, gi) => (
            <View key={gi} style={[s.exerciseCard, isDesktop && s.exerciseCardDesktop]}>
              <View style={s.exerciseCardHeader}>
                <Text style={s.exerciseName}>{group.name}</Text>
                <TouchableOpacity style={s.addSetBtn} onPress={() => openModal(group.name)}>
                  <Text style={s.addSetBtnText}>+ Set</Text>
                </TouchableOpacity>
              </View>
              {group.sets.map((set, si) => (
                <View key={si} style={[s.setRow, si > 0 && s.setRowBorder]}>
                  <Text style={s.setNum}>Set {set.set_number}</Text>
                  <Text style={s.setDetail}>{set.reps_done} reps · {set.weight}kg</Text>
                  <Text style={s.setRpe}>RPE {set.rpe}</Text>
                  <Text style={[s.setFeeling, { color: FEELINGS.find(f => f.key === set.feeling)?.color ?? C.muted }]}>
                    {FEELINGS.find(f => f.key === set.feeling)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => deleteSet(set.exercise_name, set.set_number)}>
                    <Text style={s.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.newExerciseBtn} onPress={() => openModal()}>
          <Text style={s.newExerciseBtnText}>+ New exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, isDesktop && s.modalContentDesktop]}>
            <Text style={s.modalTitle}>Log set</Text>
            <TextInput style={s.input} placeholder="Exercise name" placeholderTextColor={C.muted} value={exercise} onChangeText={setExercise} />
            <View style={s.row}>
              <TextInput style={[s.input, s.inputHalf]} placeholder="Reps" placeholderTextColor={C.muted} value={reps} onChangeText={setReps} keyboardType="numeric" />
              <TextInput style={[s.input, s.inputHalf]} placeholder="Weight (kg)" placeholderTextColor={C.muted} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
            </View>
            <Text style={s.fieldLabel}>RPE: {rpe}</Text>
            <View style={s.scaleRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <TouchableOpacity key={n} style={[s.scaleBtn, rpe === n && s.scaleBtnActive]} onPress={() => setRpe(n)}>
                  <Text style={[s.scaleBtnText, rpe === n && s.scaleBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Feeling</Text>
            <View style={s.feelingRow}>
              {FEELINGS.map(f => (
                <TouchableOpacity key={f.key} style={[s.feelingBtn, feeling === f.key && { borderColor: f.color }]} onPress={() => setFeeling(f.key)}>
                  <Text style={[s.feelingText, feeling === f.key && { color: f.color }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.redBtn} onPress={logSet} disabled={modalLoading}>
              {modalLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.redBtnText}>Confirm set →</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 24, paddingTop: 48, paddingBottom: 40 },
  contentDesktop: { padding: 40, paddingTop: 40 },
  startWrap: { justifyContent: 'center', alignItems: 'center' },
  startInner: { padding: 24, width: '100%' as any },
  startInnerDesktop: { maxWidth: 480 },
  pageLabel: { fontSize: 10, fontWeight: '700', color: C.red, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { fontSize: 40, fontWeight: '800', color: C.text, lineHeight: 44, marginBottom: 24 },
  startSub: { fontSize: 15, color: C.sub, lineHeight: 24, marginBottom: 32 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  exercisesGrid: { gap: 12, marginBottom: 16 },
  exercisesGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  exerciseCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  exerciseCardDesktop: { flex: 1, minWidth: 320 },
  exerciseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: C.text },
  addSetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  addSetBtnText: { fontSize: 13, fontWeight: '600', color: C.sub },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  setRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  setNum: { fontSize: 12, fontWeight: '600', color: C.muted, width: 40 },
  setDetail: { fontSize: 13, color: C.text, flex: 1 },
  setRpe: { fontSize: 12, color: C.muted },
  setFeeling: { fontSize: 12, fontWeight: '500' },
  deleteBtn: { fontSize: 14, color: C.muted, paddingHorizontal: 4 },
  newExerciseBtn: { borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  newExerciseBtnText: { fontSize: 15, fontWeight: '600', color: C.sub },
  finishBtn: { borderWidth: 1, borderColor: C.borderStrong, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  finishBtnText: { fontSize: 14, color: C.sub, fontWeight: '600' },
  redBtn: { backgroundColor: C.red, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  redBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  resultWrap: { padding: 24, paddingTop: 48 },
  resultWrapDesktop: { maxWidth: 600, padding: 40 },
  resultCard: { backgroundColor: C.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 12 },
  decisionText: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  suggestedWeight: { fontSize: 15, color: C.sub, marginBottom: 4 },
  reasonText: { fontSize: 14, color: C.sub, lineHeight: 22 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { fontSize: 13, color: C.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalContentDesktop: { borderRadius: 24, margin: 40, paddingBottom: 32 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 20 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, color: C.text, fontSize: 15, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: C.sub, marginBottom: 10, letterSpacing: 0.5 },
  scaleRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  scaleBtn: { flex: 1, aspectRatio: 1, borderRadius: 6, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  scaleBtnActive: { backgroundColor: C.red, borderColor: C.red },
  scaleBtnText: { fontSize: 11, fontWeight: '600', color: C.muted },
  scaleBtnTextActive: { color: '#fff' },
  feelingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  feelingBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  feelingText: { fontSize: 13, fontWeight: '500', color: C.muted },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: C.muted },
})
