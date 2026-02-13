<script setup lang="ts">
import { Mail, MailOpen, Trash2, Clock } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Nachrichten - Fit & Fun Admin',
})

const client = useSupabaseClient()

// Fetch Nachrichten
const { data: nachrichten, refresh } = await useAsyncData('admin-nachrichten', async () => {
  const { data } = await client
    .from('kontakt_nachrichten')
    .select('*')
    .order('erstellt_am', { ascending: false })
  return data || []
})

const selectedNachricht = ref<any>(null)

const openNachricht = async (nachricht: any) => {
  selectedNachricht.value = nachricht

  // Als gelesen markieren
  if (!nachricht.gelesen) {
    await client
      .from('kontakt_nachrichten')
      .update({ gelesen: true })
      .eq('id', nachricht.id)
    await refresh()
  }
}

const deleteNachricht = async (id: string) => {
  if (!confirm('Nachricht wirklich löschen?')) return

  try {
    await client.from('kontakt_nachrichten').delete().eq('id', id)
    if (selectedNachricht.value?.id === id) {
      selectedNachricht.value = null
    }
    await refresh()
  } catch (e) {
    console.error(e)
    alert('Fehler beim Löschen')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-slate-900 mb-8">Nachrichten</h1>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Liste -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
          <button
            v-for="nachricht in nachrichten"
            :key="nachricht.id"
            @click="openNachricht(nachricht)"
            :class="[
              'w-full p-4 text-left hover:bg-slate-50 transition-colors',
              selectedNachricht?.id === nachricht.id ? 'bg-primary-50' : '',
              !nachricht.gelesen ? 'bg-orange-50' : ''
            ]"
          >
            <div class="flex items-start gap-3">
              <div :class="['p-2 rounded-lg', nachricht.gelesen ? 'bg-slate-100' : 'bg-orange-100']">
                <MailOpen v-if="nachricht.gelesen" class="w-4 h-4 text-slate-500" />
                <Mail v-else class="w-4 h-4 text-orange-600" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p :class="['font-medium truncate', !nachricht.gelesen ? 'text-slate-900' : 'text-slate-700']">
                    {{ nachricht.name }}
                  </p>
                  <span class="text-xs text-slate-500 whitespace-nowrap">
                    {{ formatDate(nachricht.erstellt_am) }}
                  </span>
                </div>
                <p class="text-sm text-slate-500 truncate">{{ nachricht.email }}</p>
                <p class="text-sm text-slate-600 line-clamp-2 mt-1">{{ nachricht.nachricht }}</p>
              </div>
            </div>
          </button>

          <div v-if="!nachrichten?.length" class="p-8 text-center text-slate-500">
            Keine Nachrichten vorhanden.
          </div>
        </div>
      </div>

      <!-- Detail -->
      <div v-if="selectedNachricht" class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">{{ selectedNachricht.name }}</h2>
            <a :href="`mailto:${selectedNachricht.email}`" class="text-primary-600 hover:underline">
              {{ selectedNachricht.email }}
            </a>
          </div>
          <button
            @click="deleteNachricht(selectedNachricht.id)"
            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>

        <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Clock class="w-4 h-4" />
          {{ formatDate(selectedNachricht.erstellt_am) }}
        </div>

        <div class="bg-slate-50 rounded-lg p-4">
          <p class="text-slate-700 whitespace-pre-wrap">{{ selectedNachricht.nachricht }}</p>
        </div>

        <div class="mt-6">
          <a
            :href="`mailto:${selectedNachricht.email}?subject=Re: Fit & Fun Kontaktanfrage`"
            class="inline-flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Mail class="w-4 h-4" />
            Antworten
          </a>
        </div>
      </div>

      <div v-else class="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center text-slate-400">
        <div class="text-center">
          <Mail class="w-12 h-12 mx-auto mb-2" />
          <p>Nachricht auswählen</p>
        </div>
      </div>
    </div>
  </div>
</template>
