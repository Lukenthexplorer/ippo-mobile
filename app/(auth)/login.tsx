import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native'
import { supabase } from '../../src/lib/supabase'
import { useLayout } from '../../src/hooks/useLayout'

const C = {
  bg: '#080808', surface: '#111111', border: '#1E1E1E',
  text: '#F0F0F0', muted: '#555555', sub: '#888888',
  red: '#E8192C', redDim: '#3D0A0F',
}

export default function Login() {
  const { isDesktop } = useLayout()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  async function handleAuth() {
    setLoading(true)
    setError('')
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>
      {/* Left panel — só no desktop */}
      {isDesktop && (
        <View style={s.left}>
          <View style={s.leftInner}>
            <Text style={s.leftLogo}>IPPO</Text>
            <Text style={s.leftTagline}>Your adaptive{'\n'}coach.</Text>
            <View style={s.leftDivider} />
            <Text style={s.leftSub}>
              Trains like a real coach.{'\n'}
              Adjusts based on your performance.{'\n'}
              No static plans.
            </Text>
            <View style={s.stats}>
              {[
                { n: '6', label: 'Training rules' },
                { n: 'AI', label: 'Powered coach' },
                { n: '∞', label: 'Adaptive plans' },
              ].map((item, i) => (
                <View key={i} style={s.statItem}>
                  <Text style={s.statN}>{item.n}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={s.leftFooter}>Built for serious athletes.</Text>
        </View>
      )}

      {/* Right panel — form */}
      <ScrollView
        style={[s.right, !isDesktop && s.rightMobile]}
        contentContainerStyle={s.rightContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.formWrap, !isDesktop && s.formWrapMobile]}>
          {!isDesktop && <Text style={s.mobileLogo}>IPPO</Text>}

          <Text style={s.formTitle}>{isSignup ? 'Create account' : 'Sign in'}</Text>
          <Text style={s.formSub}>{isSignup ? 'Start training smarter.' : 'Welcome back.'}</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={[s.field, focused === 'email' && s.fieldFocused]}>
            <Text style={s.fieldLabel}>EMAIL</Text>
            <TextInput
              style={s.fieldInput}
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={[s.field, focused === 'password' && s.fieldFocused]}>
            <Text style={s.fieldLabel}>PASSWORD</Text>
            <TextInput
              style={s.fieldInput}
              placeholder="••••••••"
              placeholderTextColor={C.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <TouchableOpacity style={[s.btn, loading && s.btnDim]} onPress={handleAuth} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>{isSignup ? 'Create account' : 'Sign in'} →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.toggle} onPress={() => { setIsSignup(!isSignup); setError('') }}>
            <Text style={s.toggleText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={s.toggleLink}>{isSignup ? 'Sign in' : 'Sign up'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, flexDirection: 'row' },
  left: { flex: 1, backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.border, padding: 48, justifyContent: 'space-between' },
  leftInner: { flex: 1, justifyContent: 'center' },
  leftLogo: { fontSize: 11, fontWeight: '700', color: C.red, letterSpacing: 4, marginBottom: 48 },
  leftTagline: { fontSize: 56, fontWeight: '800', color: C.text, lineHeight: 60, marginBottom: 32 },
  leftDivider: { width: 40, height: 2, backgroundColor: C.red, marginBottom: 32 },
  leftSub: { fontSize: 15, color: C.sub, lineHeight: 26, marginBottom: 64 },
  stats: { flexDirection: 'row', gap: 32 },
  statItem: { gap: 4 },
  statN: { fontSize: 32, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 12, color: C.muted, letterSpacing: 1 },
  leftFooter: { fontSize: 12, color: C.muted, letterSpacing: 1 },
  right: { width: 480, backgroundColor: C.bg },
  rightMobile: { flex: 1, width: '100%' as any },
  rightContent: { flex: 1, justifyContent: 'center', padding: 32, minHeight: 500 },
  formWrap: { maxWidth: 360, width: '100%' as any },
  formWrapMobile: { maxWidth: '100%' as any },
  mobileLogo: { fontSize: 24, fontWeight: '800', color: C.red, letterSpacing: 4, marginBottom: 40 },
  formTitle: { fontSize: 28, fontWeight: '700', color: C.text, marginBottom: 6 },
  formSub: { fontSize: 14, color: C.sub, marginBottom: 32 },
  errorBox: { backgroundColor: C.redDim, borderWidth: 1, borderColor: C.red, borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: C.red, fontSize: 13 },
  field: { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, backgroundColor: C.surface, marginBottom: 12 },
  fieldFocused: { borderColor: C.red },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 6 },
  fieldInput: { color: C.text, fontSize: 15, outlineStyle: 'none' } as any,
  btn: { backgroundColor: C.red, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  btnDim: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  toggle: { alignItems: 'center' },
  toggleText: { fontSize: 13, color: C.sub },
  toggleLink: { color: C.text, fontWeight: '600' },
})
