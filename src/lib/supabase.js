import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
    : null

function createMissingConfigResponse() {
  return {
    data: null,
    error: new Error(supabaseConfigError),
  }
}

function createMissingSupabaseClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error(supabaseConfigError) }),
      getUser: async () => ({ data: { user: null }, error: new Error(supabaseConfigError) }),
      signUp: async () => createMissingConfigResponse(),
      signInWithPassword: async () => createMissingConfigResponse(),
      signInWithOAuth: async () => createMissingConfigResponse(),
      signInAnonymously: async () => createMissingConfigResponse(),
      signOut: async () => createMissingConfigResponse(),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      }),
    },
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => createMissingConfigResponse(),
              }
            },
          }
        },
        upsert: async () => createMissingConfigResponse(),
      }
    },
  }
}

export const supabase = supabaseConfigError
  ? createMissingSupabaseClient()
  : createClient(supabaseUrl, supabaseAnonKey)
