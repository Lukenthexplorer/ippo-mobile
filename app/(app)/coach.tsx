import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { api } from '../../src/lib/api'
import { colors } from '../../src/constants/colors'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  "Como foi meu treino essa semana?",
  "O que devo focar agora?",
  "Tô evoluindo?",
  "Que exercício devo priorizar?",
]

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  async function sendMessage(text?: string) {
    const content = text || input.trim()
    if (!content || loading) return

    const userMessage: Message = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const data = await api<{ reply: string }>('/coach/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: newMessages }),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Tô fora do ar. Tenta de novo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <Text style={styles.title}>Coach</Text>

        {messages.length === 0 && (
          <View style={styles.starters}>
            <Text style={styles.startersLabel}>Pergunte algo</Text>
            {STARTERS.map((s, i) => (
              <TouchableOpacity key={i} style={styles.starterBtn} onPress={() => sendMessage(s)}>
                <Text style={styles.starterText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map((msg, i) => (
          <View key={i} style={[
            styles.bubble,
            msg.role === 'user' ? styles.bubbleUser : styles.bubbleCoach
          ]}>
            {msg.role === 'assistant' && (
              <Text style={styles.bubbleLabel}>IPPO</Text>
            )}
            <Text style={[
              styles.bubbleText,
              msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextCoach
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.bubbleCoach}>
            <Text style={styles.bubbleLabel}>IPPO</Text>
            <ActivityIndicator color={colors.textSecondary} size="small" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Fala com o coach..."
          placeholderTextColor={colors.textTertiary}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messages: { padding: 24, paddingTop: 64, paddingBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 24 },
  starters: { gap: 8 },
  startersLabel: { fontSize: 13, color: colors.textTertiary, marginBottom: 8 },
  starterBtn: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  starterText: { fontSize: 14, color: colors.textSecondary },
  bubble: { borderRadius: 16, padding: 14, marginBottom: 10, maxWidth: '85%' },
  bubbleUser: { backgroundColor: colors.text, alignSelf: 'flex-end' },
  bubbleCoach: { backgroundColor: colors.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border },
  bubbleLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 1, marginBottom: 6 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: colors.background },
  bubbleTextCoach: { color: colors.text },
  inputRow: { flexDirection: 'row', padding: 12, paddingBottom: 32, gap: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  input: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border, maxHeight: 120 },
  sendBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  sendBtnDisabled: { opacity: 0.3 },
  sendBtnText: { fontSize: 20, color: colors.background, fontWeight: '700' },
})