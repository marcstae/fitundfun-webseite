<script setup lang="ts">
import { LogIn } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: 'auth'
})

useHead({
  title: 'Login - Fit & Fun Admin',
})

const router = useRouter()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

const login = async () => {
  if (!email.value || !password.value) {
    error.value = 'Bitte E-Mail und Passwort eingeben.'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // Login via Server API (umgeht das Client-URL-Problem)
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    // Seite neu laden um Session-Cookies zu aktivieren
    // Dies ist der sauberste Weg, da der Supabase-Client die Cookies beim Laden liest
    window.location.href = '/admin'
  } catch (e: any) {
    console.error('Login Error:', e)
    // $fetch wirft bei HTTP-Fehlern eine Exception mit statusMessage
    error.value = e.data?.statusMessage || e.statusMessage || 'Ein Fehler ist aufgetreten.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">Fit & Fun</h1>
        <p class="text-primary-200">Admin Login</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="login" class="bg-white rounded-xl p-8 shadow-2xl">
        <!-- Error -->
        <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {{ error }}
        </div>

        <!-- Email -->
        <div class="mb-6">
          <label for="email" class="block text-sm font-medium text-slate-700 mb-2">
            E-Mail
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            placeholder="admin@example.com"
          />
        </div>

        <!-- Password -->
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-slate-700 mb-2">
            Passwort
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <LogIn class="w-5 h-5" />
          {{ isLoading ? 'Anmelden...' : 'Anmelden' }}
        </button>
      </form>

      <!-- Back Link -->
      <div class="text-center mt-6">
        <NuxtLink to="/" class="text-primary-200 hover:text-white transition-colors text-sm">
          ← Zurück zur Website
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
