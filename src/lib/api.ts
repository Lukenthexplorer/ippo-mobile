import { supabase } from './supabase'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getHeaders()
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Erro ${response.status}`)
  }

  return response.json()
}