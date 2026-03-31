import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform
} from 'react-native'
import { supabase } from '../../src/lib/supabase'

const C = {
  bg: '#080808',
  surface: '#111111',
  border: '#1E1E1E',
  borderStrong: '#2E2E2E',
  text: '#F0F0F0',
  textMuted: '#555555',
  textSub: '#888888',
  red: '#E8192C',
  redDim: '#3D0A0F',
}

export default function Login() {
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

  const isWeb = Platform.OS === 'web'

  return (
    <View style={styles.root}>
      {/* Left panel — branding (só no desktop web) */}
      {isWeb && (
        <View style={styles.left}>
          <View style={styles.leftInner}>
            <Text style={styles.leftLogo}>IPPO</Text>
            <Text style={styles.leftTagline}>Your adaptive{'\n'}coach.</Text>
            <View style={styles.leftDivider} />
            <Text style={styles.leftSub}>
              Trains like a real coach.{'\n'}
              Adjusts based on your performance.{'\n'}
              No static plans.
            </Text>
            <View style={styles.leftStats}>
              {[
                { n: '6', label: 'Training rules' },
                { n: 'AI', label: 'Powered coach' },
                { n: '∞', label: 'Adaptive plans' },
              ].map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statN}>{s.n}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.leftFooter}>Built for serious athletes.</Text>
        </View>
      )}

      {/* Right panel — form */}
      <View style={[styles.right, !isWeb && styles.rightMobile]}>
        <View style={styles.formWrap}>
          {!isWeb && <Text style={styles.mobileLogo}>IPPO</Text>}

          <Text style={styles.formTitle}>
            {isSignup ? 'Create account' : 'Sign in'}
          </Text>
          <Text style={styles.formSub}>
            {isSignup ? 'Start training smarter.' : 'Welcome back.'}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <View style={[styles.field, focused === 'email' && styles.fieldFocused]}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>

            <View style={[styles.field, focused === 'password' && styles.fieldFocused]}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="••••••••"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnLoading]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={C.text} />
              : <Text style={styles.btnText}>
                  {isSignup ? 'Create account' : 'Sign in'} →
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggle} onPress={() => { setIsSignup(!isSignup); setError('') }}>
            <Text style={styles.toggleText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleLink}>{isSignup ? 'Sign in' : 'Sign up'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    flexDirection: 'row',
  },

  // Left
  left: {
    flex: 1,
    backgroundColor: C.surface,
    borderRightWidth: 1,
    borderRightColor: C.border,
    padding: 48,
    justifyContent: 'space-between',
  },
  leftInner: { flex: 1, justifyContent: 'center' },
  leftLogo: {
    fontSize: 13,
    fontWeight: '700',
    color: C.red,
    letterSpacing: 4,
    marginBottom: 48,
  },
  leftTagline: {
    fontSize: 56,
    fontWeight: '800',
    color: C.text,
    lineHeight: 60,
    marginBottom: 32,
  },
  leftDivider: {
    width: 40,
    height: 2,
    backgroundColor: C.red,
    marginBottom: 32,
  },
  leftSub: {
    fontSize: 15,
    color: C.textSub,
    lineHeight: 26,
    marginBottom: 64,
  },
  leftStats: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: { gap: 4 },
  statN: {
    fontSize: 32,
    fontWeight: '800',
    color: C.text,
  },
  statLabel: {
    fontSize: 12,
    color: C.textMuted,
    letterSpacing: 1,
  },
  leftFooter: {
    fontSize: 12,
    color: C.textMuted,
    letterSpacing: 1,
  },

  // Right
  right: {
    width: 480,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  rightMobile: {
    flex: 1,
    width: '100%',
  },
  formWrap: {
    width: '100%',
    maxWidth: 360,
  },
  mobileLogo: {
    fontSize: 28,
    fontWeight: '800',
    color: C.red,
    letterSpacing: 4,
    marginBottom: 40,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
  },
  formSub: {
    fontSize: 14,
    color: C.textSub,
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: C.redDim,
    borderWidth: 1,
    borderColor: C.red,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: C.red,
    fontSize: 13,
  },
  fields: { gap: 12, marginBottom: 24 },
  field: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: C.surface,
  },
  fieldFocused: {
    borderColor: C.red,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 2,
    marginBottom: 6,
  },
  fieldInput: {
    color: C.text,
    fontSize: 15,
    outlineStyle: 'none',
  } as any,
  btn: {
    backgroundColor: C.red,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnLoading: { opacity: 0.7 },
  btnText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggle: { alignItems: 'center' },
  toggleText: {
    fontSize: 13,
    color: C.textSub,
  },
  toggleLink: {
    color: C.text,
    fontWeight: '600',
  },
})