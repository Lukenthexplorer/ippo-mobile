import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Modal
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { api } from '../../src/lib/api'
import { colors } from '../../src/constants/colors'

type Exercise = {
  id?: string
  name: string
  target_sets: number
  target_reps: number
  target_weight: number | null
  order: number
}

type WorkoutDay = {
  id?: string
  name: string
  day_order: number
  exercises: Exercise[]
}

type Plan = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  days: WorkoutDay[]
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  // Novo plano
  const [planName, setPlanName] = useState('')
  const [planDesc, setPlanDesc] = useState('')
  const [days, setDays] = useState<WorkoutDay[]>([
    { name: 'Day A', day_order: 1, exercises: [] }
  ])

  async function loadPlans() {
    setLoading(true)
    try {
      const data = await api<Plan[]>('/plans/')
      setPlans(data)
    } catch (e) {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { loadPlans() }, []))

  function addDay() {
    setDays(prev => [...prev, {
      name: `Day ${String.fromCharCode(65 + prev.length)}`,
      day_order: prev.length + 1,
      exercises: []
    }])
  }

  function addExercise(dayIndex: number) {
    setDays(prev => {
      const updated = [...prev]
      updated[dayIndex].exercises.push({
        name: '',
        target_sets: 3,
        target_reps: 10,
        target_weight: null,
        order: updated[dayIndex].exercises.length + 1
      })
      return updated
    })
  }

  function updateExercise(dayIndex: number, exIndex: number, field: keyof Exercise, value: any) {
    setDays(prev => {
      const updated = [...prev]
      updated[dayIndex].exercises[exIndex] = {
        ...updated[dayIndex].exercises[exIndex],
        [field]: value
      }
      return updated
    })
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    setDays(prev => {
      const updated = [...prev]
      updated[dayIndex].exercises.splice(exIndex, 1)
      return [...updated]
    })
  }

  async function createPlan() {
    if (!planName.trim()) {
      Alert.alert('Plan name is required')
      return
    }
    const hasEmptyExercise = days.some(d => d.exercises.some(e => !e.name.trim()))
    if (hasEmptyExercise) {
      Alert.alert('Fill all exercise names')
      return
    }
    setCreating(true)
    try {
      await api('/plans/', {
        method: 'POST',
        body: JSON.stringify({
          name: planName,
          description: planDesc || null,
          days,
        }),
      })
      setModalVisible(false)
      setPlanName('')
      setPlanDesc('')
      setDays([{ name: 'Day A', day_order: 1, exercises: [] }])
      loadPlans()
    } catch (e: any) {
      Alert.alert('Erro', e.message)
    } finally {
      setCreating(false)
    }
  }

  async function deletePlan(planId: string) {
    Alert.alert('Delete plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api(`/plans/${planId}`, { method: 'DELETE' })
            loadPlans()
          } catch (e: any) {
            Alert.alert('Erro', e.message)
          }
        }
      }
    ])
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Plans</Text>
          <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.text} style={{ marginTop: 40 }} />
        ) : plans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No plans yet.</Text>
            <Text style={styles.emptySubtext}>Create a plan to structure your training.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyBtnText}>Create first plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map(plan => (
            <View key={plan.id} style={styles.planCard}>
              <TouchableOpacity
                style={styles.planHeader}
                onPress={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.description && (
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  )}
                  <Text style={styles.planMeta}>{plan.days.length} days</Text>
                </View>
                <Text style={styles.expandIcon}>{expandedPlan === plan.id ? '↑' : '↓'}</Text>
              </TouchableOpacity>

              {expandedPlan === plan.id && (
                <View style={styles.planDays}>
                  {plan.days.map((day, di) => (
                    <View key={di} style={styles.daySection}>
                      <Text style={styles.dayName}>{day.name}</Text>
                      {day.exercises.map((ex, ei) => (
                        <View key={ei} style={styles.exerciseRow}>
                          <Text style={styles.exerciseName}>{ex.name}</Text>
                          <Text style={styles.exerciseDetail}>
                            {ex.target_sets}×{ex.target_reps}
                            {ex.target_weight ? ` · ${ex.target_weight}kg` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deletePlan(plan.id)}
                  >
                    <Text style={styles.deleteBtnText}>Delete plan</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal criar plano */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New plan</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Plan name (e.g. Push Pull Legs)"
            placeholderTextColor={colors.textTertiary}
            value={planName}
            onChangeText={setPlanName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textTertiary}
            value={planDesc}
            onChangeText={setPlanDesc}
          />

          {days.map((day, di) => (
            <View key={di} style={styles.dayCard}>
              <TextInput
                style={styles.dayInput}
                value={day.name}
                onChangeText={v => setDays(prev => {
                  const u = [...prev]; u[di].name = v; return u
                })}
                placeholderTextColor={colors.textTertiary}
              />

              {day.exercises.map((ex, ei) => (
                <View key={ei} style={styles.exRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Exercise"
                    placeholderTextColor={colors.textTertiary}
                    value={ex.name}
                    onChangeText={v => updateExercise(di, ei, 'name', v)}
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Sets"
                    placeholderTextColor={colors.textTertiary}
                    value={String(ex.target_sets)}
                    onChangeText={v => updateExercise(di, ei, 'target_sets', parseInt(v) || 0)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Reps"
                    placeholderTextColor={colors.textTertiary}
                    value={String(ex.target_reps)}
                    onChangeText={v => updateExercise(di, ei, 'target_reps', parseInt(v) || 0)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={() => removeExercise(di, ei)}>
                    <Text style={styles.removeEx}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addExBtn} onPress={() => addExercise(di)}>
                <Text style={styles.addExBtnText}>+ Add exercise</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addDayBtn} onPress={addDay}>
            <Text style={styles.addDayBtnText}>+ Add day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.createBtn} onPress={createPlan} disabled={creating}>
            {creating
              ? <ActivityIndicator color={colors.background} />
              : <Text style={styles.createBtnText}>Create plan</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 64, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text },
  newBtn: { backgroundColor: colors.text, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  newBtnText: { fontSize: 14, fontWeight: '600', color: colors.background },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, marginBottom: 32, textAlign: 'center' },
  emptyBtn: { backgroundColor: colors.text, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: colors.background },
  planCard: { backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  planHeader: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '600', color: colors.text },
  planDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  planMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
  expandIcon: { fontSize: 16, color: colors.textTertiary },
  planDays: { borderTopWidth: 1, borderTopColor: colors.border, padding: 16 },
  daySection: { marginBottom: 16 },
  dayName: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, letterSpacing: 0.5, marginBottom: 8 },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  exerciseName: { fontSize: 14, color: colors.text },
  exerciseDetail: { fontSize: 13, color: colors.textSecondary },
  deleteBtn: { marginTop: 8, padding: 12, alignItems: 'center' },
  deleteBtnText: { fontSize: 14, color: colors.accentRed },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: 24, paddingTop: 64, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  modalClose: { fontSize: 15, color: colors.textSecondary },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, fontSize: 15, marginBottom: 10 },
  dayCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  dayInput: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12, padding: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  exRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  inputSmall: { width: 56, marginBottom: 0, textAlign: 'center', padding: 10 },
  removeEx: { fontSize: 16, color: colors.textTertiary, paddingHorizontal: 4 },
  addExBtn: { padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, borderStyle: 'dashed', marginTop: 4 },
  addExBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  addDayBtn: { padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, borderStyle: 'dashed', marginBottom: 16 },
  addDayBtnText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  createBtn: { backgroundColor: colors.text, borderRadius: 12, padding: 18, alignItems: 'center' },
  createBtnText: { fontSize: 16, fontWeight: '600', color: colors.background },
})