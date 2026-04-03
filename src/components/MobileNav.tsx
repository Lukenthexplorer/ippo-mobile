import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useLayout } from '../hooks/useLayout'

const C = {
  bg: '#080808', surface: '#111111',
  border: '#1E1E1E', text: '#F0F0F0', muted: '#555555', sub: '#888888',
  red: '#E8192C',
}

const LINKS = [
  { label: 'Today', route: '/(app)/home' },
  { label: 'Plans', route: '/(app)/plans' },
  { label: 'Train', route: '/(app)/session' },
  { label: 'Progress', route: '/(app)/progress' },
  { label: 'Coach', route: '/(app)/coach' },
]

export default function MobileNav() {
  const { isDesktop } = useLayout()
  const [open, setOpen] = useState(false)

  if (isDesktop) return null

  return (
    <>
      <View style={s.header}>
        <Text style={s.logo}>IPPO</Text>
        <TouchableOpacity onPress={() => setOpen(true)} style={s.hamburger}>
          <View style={s.bar} />
          <View style={s.bar} />
          <View style={s.bar} />
        </TouchableOpacity>
      </View>

      <Modal visible={open} animationType="fade" transparent>
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <View style={s.menu}>
            <View style={s.menuHeader}>
              <Text style={s.menuLogo}>IPPO</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {LINKS.map((link, i) => (
              <TouchableOpacity
                key={i}
                style={s.menuItem}
                onPress={() => {
                  setOpen(false)
                  router.push(link.route as any)
                }}
              >
                <Text style={s.menuItemText}>{link.label}</Text>
                <Text style={s.menuItemArrow}>→</Text>
              </TouchableOpacity>
            ))}

            <View style={s.menuDivider} />

            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                setOpen(false)
                supabase.auth.signOut()
              }}
            >
              <Text style={[s.menuItemText, { color: C.muted }]}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  logo: { fontSize: 11, fontWeight: '700', color: C.red, letterSpacing: 4 },
  hamburger: { gap: 5, padding: 4 },
  bar: { width: 22, height: 2, backgroundColor: C.text, borderRadius: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  menu: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: 280,
    backgroundColor: C.surface,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    padding: 32,
    paddingTop: 56,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  menuLogo: { fontSize: 11, fontWeight: '700', color: C.red, letterSpacing: 4 },
  closeBtn: { fontSize: 18, color: C.muted },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  menuItemText: { fontSize: 18, fontWeight: '600', color: C.text },
  menuItemArrow: { fontSize: 16, color: C.muted },
  menuDivider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
})