import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { api } from '../../src/lib/api'
import { useLayout } from '../../src/hooks/useLayout'

const C = {
  bg: '#080808', surface: '#111111', surface2: '#181818',
  border: '#1E1E1E', text: '#F0F0F0', muted: '#555555', sub: '#888888',
  red: '#E8192C',
}

type Message = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  "Como foi meu treino essa semana?",
  "O que devo focar agora?",
  "Tô evoluindo?",
  "Que exercício devo priorizar?",
]

export default function Coach() {
  const { isDesktop } = useLayout()
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
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={[s.inner, isDesktop && s.innerDesktop]}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <Text style={s.pageLabel}>COACH</Text>
          <Text style={s.pageTitle}>IPPO.</Text>
          <Text style={s.pageSub}>Direto, honesto e sem papas na língua.</Text>

          {messages.length === 0 && (
            <View style={s.starters}>
              <Text style={s.startersLabel}>PERGUNTE ALGO</Text>
              {STARTERS.map((starter, i) => (
                <TouchableOpacity key={i} style={s.starterBtn} onPress={() => sendMessage(starter)}>
                  <Text style={s.starterText}>{starter}</Text>
                  <Text style={s.starterArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {messages.map((msg, i) => (
            <View key={i} style={[
              s.bubble,
              msg.role === 'user' ? s.bubbleUser : s.bubbleCoach
            ]}>
              {msg.role === 'assistant' && <Text style={s.bubbleLabel}>IPPO</Text>}
              <Text style={[s.bubbleText, msg.role === 'user' ? s.bubbleTextUser : s.bubbleTextCoach]}>
                {msg.content}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={s.bubbleCoach}>
              <Text style={s.bubbleLabel}>IPPO</Text>
              <ActivityIndicator color={C.sub} size="small" />
            </View>
          )}
        </ScrollView>

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Fala com o coach..."
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDim]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={s.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1 },
  innerDesktop: { maxWidth: 720, alignSelf: 'center' as any, width: '100%' as any },
  messages: { padding: 24, paddingTop: 40, paddingBottom: 20 },
  pageLabel: { fontSize: 10, fontWeight: '700', color: C.red, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { fontSize: 40, fontWeight: '800', color: C.text, marginBottom: 4 },
  pageSub: { fontSize: 14, color: C.muted, marginBottom: 32 },
  starters: { gap: 8, marginBottom: 8 },
  startersLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 8 },
  starterBtn: { backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starterText: { fontSize: 14, color: C.sub, flex: 1 },
  starterArrow: { fontSize: 16, color: C.muted },
  bubble: { borderRadius: 16, padding: 16, marginBottom: 10, maxWidth: '85%' as any },
  bubbleUser: { backgroundColor: C.red, alignSelf: 'flex-end' as any },
  bubbleCoach: { backgroundColor: C.surface, alignSelf: 'flex-start' as any, borderWidth: 1, borderColor: C.border },
  bubbleLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 8 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextCoach: { color: C.text },
  inputRow: { flexDirection: 'row', padding: 16, paddingBottom: 32, gap: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  input: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border, maxHeight: 120 },
  sendBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' as any },
  sendBtnDim: { opacity: 0.3 },
  sendBtnText: { fontSize: 20, color: '#fff', fontWeight: '700' },
})
