<script setup lang="ts">
import { Send, CheckCircle } from 'lucide-vue-next'

useHead({
  title: 'Kontakt - Fit & Fun',
})

const form = reactive({
  name: '',
  email: '',
  nachricht: ''
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const error = ref('')

const submitForm = async () => {
  if (!form.name || !form.email || !form.nachricht) {
    error.value = 'Bitte fülle alle Felder aus.'
    return
  }
  
  // Client-side validation
  if (form.nachricht.length < 10) {
    error.value = 'Die Nachricht muss mindestens 10 Zeichen haben.'
    return
  }
  
  if (form.nachricht.length > 5000) {
    error.value = 'Die Nachricht darf maximal 5000 Zeichen haben.'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    // Use server API with rate limiting and validation
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        nachricht: form.nachricht
      }
    })

    isSubmitted.value = true
    form.name = ''
    form.email = ''
    form.nachricht = ''
  } catch (e: any) {
    // Handle rate limiting error
    if (e.statusCode === 429) {
      error.value = e.data?.statusMessage || 'Zu viele Anfragen. Bitte warte etwas.'
    } else if (e.statusCode === 400) {
      // Validation error
      const errors = e.data?.data?.errors
      if (errors?.length) {
        error.value = errors.map((err: any) => err.message).join(', ')
      } else {
        error.value = e.data?.statusMessage || 'Ungültige Eingabe.'
      }
    } else {
      error.value = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-slate-900 mb-4">Kontakt</h1>
        <p class="text-lg text-slate-600">
          Hast du Fragen zum Lager? Schreib uns eine Nachricht!
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="isSubmitted" class="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-green-800 mb-2">Nachricht gesendet!</h2>
        <p class="text-green-700">Vielen Dank für deine Nachricht. Wir melden uns bald bei dir.</p>
        <button
          @click="isSubmitted = false"
          class="mt-4 text-green-600 hover:text-green-700 font-medium"
        >
          Weitere Nachricht senden
        </button>
      </div>

      <!-- Contact Form -->
      <form v-else @submit.prevent="submitForm" class="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <!-- Error -->
        <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {{ error }}
        </div>

        <!-- Name -->
        <div class="mb-6">
          <label for="name" class="block text-sm font-medium text-slate-700 mb-2">
            Name *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            placeholder="Dein Name"
          />
        </div>

        <!-- Email -->
        <div class="mb-6">
          <label for="email" class="block text-sm font-medium text-slate-700 mb-2">
            E-Mail *
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            placeholder="deine@email.ch"
          />
        </div>

        <!-- Message -->
        <div class="mb-6">
          <label for="nachricht" class="block text-sm font-medium text-slate-700 mb-2">
            Nachricht *
          </label>
          <textarea
            id="nachricht"
            v-model="form.nachricht"
            required
            rows="5"
            class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
            placeholder="Deine Nachricht..."
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send class="w-5 h-5" />
          {{ isSubmitting ? 'Wird gesendet...' : 'Nachricht senden' }}
        </button>
      </form>
    </div>
  </div>
</template>
