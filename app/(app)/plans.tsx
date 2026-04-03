import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Modal
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { api } from '../../src/lib/api'
import { useLayout } from '../../src/hooks/useLayout'

const C = {
  bg: '#080808', surface: '#111111', surface2: '#181818',
  border: '#1E1E1E', text: '#F0F0F0', muted: '#555555', sub: '#888888',
  red: '#E8192C', redDim: '#3D0A0F',
}

type Exercise = { id?: string; name: string; target_sets: number; target_reps: number; target_weight: number | null; order: number }
type WorkoutDay = { id?: string; name: string; day_order: number; exercises: Exercise[] }
type Plan = { id: string; name: string; description: string | null; is_active: boolean; created_at: string; days: WorkoutDay[] }

export default function Plans() {
  const { isDesktop } = useLayout()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [planName, setPlanName] = useState('')
  const [planDesc, setPlanDesc] = useState('')
  const [days, setDays] = useState<WorkoutDay[]>([{ name: 'Day A', day_order: 1, exercises: [] }])

  async function loadPlans() {
    setLoading(true)
    try { const data = await api<Plan[]>('/plans/'); setPlans(data) }
    catch (e) {}
    finally { setLoading(false) }
  }

  useFocusEffect(useCallback(() => { loadPlans() }, []))

  function addDay() {
    setDays(prev => [...prev, { name: `Day ${String.fromCharCode(65 + prev.length)}`, day_order: prev.length + 1, exercises: [] }])
  }

  function addExercise(dayIndex: number) {
    setDays(prev => {
      const updated = [...prev]
      updated[dayIndex].exercises.push({ name: '', target_sets: 3, target_reps: 10, target_weight: null, order: updated[dayIndex].exercises.length + 1 })
      return updated
    })
  }

  function updateExercise(dayIndex: number, exIndex: number, field: keyof Exercise, value: any) {
    setDays(prev => {
      const updated = [...prev]
      updated[dayIndex].exercises[exIndex] = { ...updated[dayIndex].exercises[exIndex], [field]: value }
      return updated
    })
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    setDays(prev => { const updated = [...prev]; updated[dayIndex].exercises.splice(exIndex, 1); return [...updated] })
  }

  async function createPlan() {
    if (!planName.trim()) { Alert.alert('Plan name is required'); return }
    if (days.some(d => d.exercises.some(e => !e.name.trim()))) { Alert.alert('Fill all exercise names'); return }
    setCreating(true)
    try {
      await api('/plans/', { method: 'POST', body: JSON.stringify({ name: planName, description: planDesc || null, days }) })
      setModalVisible(false)
      setPlanName(''); setPlanDesc('')
      setDays([{ name: 'Day A', day_order: 1, exercises: [] }])
      loadPlans()
    } catch (e: any) { Alert.alert('Erro', e.message) }
    finally { setCreating(false) }
  }

  async function deletePlan(planId: string) {
    Alert.alert('Delete plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api(`/plans/${planId}`, { method: 'DELETE' }); loadPlans() }
        catch (e: any) { Alert.alert('Erro', e.message) }
      }}
    ])
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
        <View style={s.header}>
          <View>
            <Text style={s.pageLabel}>WORKOUT PLANS</Text>
            <Text style={s.pageTitle}>Your plans.</Text>
          </View>
          <TouchableOpacity style={s.newBtn} onPress={() => setModalVisible(true)}>
            <Text style={s.newBtnText}>+ New plan</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={C.red} style={{ marginTop: 40 }} />
        ) : plans.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No plans yet.</Text>
            <Text style={s.emptySub}>Create a plan to structure your training.</Text>
            <TouchableOpacity style={s.redBtn} onPress={() => setModalVisible(true)}>
              <Text style={s.redBtnText}>Create first plan →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.plansGrid, isDesktop && s.plansGridDesktop]}>
            {plans.map(plan => (
              <View key={plan.id} style={[s.planCard, isDesktop && s.planCardDesktop]}>
                <TouchableOpacity
                  style={s.planHeader}
                  onPress={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.planName}>{plan.name}</Text>
                    {plan.description && <Text style={s.planDesc}>{plan.description}</Text>}
                    <Text style={s.planMeta}>{plan.days.length} days · {plan.days.reduce((acc, d) => acc + d.exercises.length, 0)} exercises</Text>
                  </View>
                  <Text style={s.expandIcon}>{expandedPlan === plan.id ? '↑' : '↓'}</Text>
                </TouchableOpacity>

                {expandedPlan === plan.id && (
                  <View style={s.planBody}>
                    <View style={s.divider} />
                    {plan.days.map((day, di) => (
                      <View key={di} style={s.daySection}>
                        <Text style={s.dayName}>{day.name}</Text>
                        {day.exercises.map((ex, ei) => (
                          <View key={ei} style={s.exRow}>
                            <Text style={s.exName}>{ex.name}</Text>
                            <Text style={s.exDetail}>{ex.target_sets}×{ex.target_reps}{ex.target_weight ? ` · ${ex.target_weight}kg` : ''}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                    <TouchableOpacity style={s.deleteBtn} onPress={() => deletePlan(plan.id)}>
                      <Text style={s.deleteBtnText}>Delete plan</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={s.modalRoot} contentContainerStyle={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New plan</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={s.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={s.input} placeholder="Plan name (e.g. Push Pull Legs)" placeholderTextColor={C.muted} value={planName} onChangeText={setPlanName} />
          <TextInput style={s.input} placeholder="Description (optional)" placeholderTextColor={C.muted} value={planDesc} onChangeText={setPlanDesc} />

          {days.map((day, di) => (
            <View key={di} style={s.dayCard}>
              <TextInput
                style={s.dayInput}
                value={day.name}
                onChangeText={v => setDays(prev => { const u = [...prev]; u[di].name = v; return u })}
                placeholderTextColor={C.muted}
              />
              {day.exercises.map((ex, ei) => (
                <View key={ei} style={s.exInputRow}>
                  <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Exercise" placeholderTextColor={C.muted} value={ex.name} onChangeText={v => updateExercise(di, ei, 'name', v)} />
                  <TextInput style={[s.input, s.inputSmall]} placeholder="Sets" placeholderTextColor={C.muted} value={String(ex.target_sets)} onChangeText={v => updateExercise(di, ei, 'target_sets', parseInt(v) || 0)} keyboardType="numeric" />
                  <TextInput style={[s.input, s.inputSmall]} placeholder="Reps" placeholderTextColor={C.muted} value={String(ex.target_reps)} onChangeText={v => updateExercise(di, ei, 'target_reps', parseInt(v) || 0)} keyboardType="numeric" />
                  <TouchableOpacity onPress={() => removeExercise(di, ei)}>
                    <Text style={s.removeEx}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addExBtn} onPress={() => addExercise(di)}>
                <Text style={s.addExBtnText}>+ Add exercise</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={s.addDayBtn} onPress={addDay}>
            <Text style={s.addDayBtnText}>+ Add day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.redBtn} onPress={createPlan} disabled={creating}>
            {creating ? <ActivityIndicator color="#fff" /> : <Text style={s.redBtnText}>Create plan →</Text>}
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 24, paddingTop: 48, paddingBottom: 60 },
  contentDesktop: { padding: 40, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  pageLabel: { fontSize: 10, fontWeight: '700', color: C.red, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { fontSize: 40, fontWeight: '800', color: C.text },
  newBtn: { backgroundColor: C.red, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 8 },
  plansGrid: { gap: 12 },
  plansGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  planCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  planCardDesktop: { flex: 1, minWidth: 300 },
  planHeader: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 2 },
  planDesc: { fontSize: 13, color: C.sub, marginBottom: 4 },
  planMeta: { fontSize: 12, color: C.muted },
  expandIcon: { fontSize: 16, color: C.muted, marginLeft: 12 },
  planBody: { paddingHorizontal: 20, paddingBottom: 16 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  daySection: { marginBottom: 16 },
  dayName: { fontSize: 11, fontWeight: '700', color: C.red, letterSpacing: 1, marginBottom: 8 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  exName: { fontSize: 14, color: C.text },
  exDetail: { fontSize: 13, color: C.sub },
  deleteBtn: { paddingVertical: 12, alignItems: 'center' },
  deleteBtnText: { fontSize: 14, color: C.red },
  redBtn: { backgroundColor: C.red, borderRadius: 10, padding: 16, alignItems: 'center' },
  redBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalRoot: { flex: 1, backgroundColor: C.bg },
  modalContent: { padding: 24, paddingTop: 64, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '700', color: C.text },
  modalClose: { fontSize: 15, color: C.sub },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, color: C.text, fontSize: 15, marginBottom: 10 },
  dayCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  dayInput: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12, padding: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  exInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  inputSmall: { width: 56, marginBottom: 0, textAlign: 'center', padding: 10 },
  removeEx: { fontSize: 16, color: C.muted, paddingHorizontal: 4 },
  addExBtn: { padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 8, borderStyle: 'dashed', marginTop: 4 },
  addExBtnText: { fontSize: 13, color: C.sub, fontWeight: '500' },
  addDayBtn: { padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, borderStyle: 'dashed', marginBottom: 16 },
  addDayBtnText: { fontSize: 14, color: C.sub, fontWeight: '500' },
})
