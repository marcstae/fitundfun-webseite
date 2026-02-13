<script setup lang="ts">
import { Plus, Pencil, Trash2, Star, StarOff } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Lager verwalten - Fit & Fun Admin',
})

const client = useSupabaseClient()

// Fetch alle Lager
const { data: lagerList, refresh } = await useAsyncData('admin-lager-list', async () => {
  const { data } = await client
    .from('lager')
    .select('*')
    .order('jahr', { ascending: false })
  return data || []
})

// Modal State
const showModal = ref(false)
const editingLager = ref<any>(null)
const form = reactive({
  jahr: new Date().getFullYear(),
  titel: '',
  datum_von: '',
  datum_bis: '',
  beschreibung: '',
  preis: '',
  immich_album_url: '',
  ist_aktuell: false
})

const isSubmitting = ref(false)

const openNewModal = () => {
  editingLager.value = null
  Object.assign(form, {
    jahr: new Date().getFullYear(),
    titel: '',
    datum_von: '',
    datum_bis: '',
    beschreibung: '',
    preis: '',
    immich_album_url: '',
    ist_aktuell: false
  })
  showModal.value = true
}

const openEditModal = (lager: any) => {
  editingLager.value = lager
  Object.assign(form, {
    jahr: lager.jahr,
    titel: lager.titel || '',
    datum_von: lager.datum_von,
    datum_bis: lager.datum_bis,
    beschreibung: lager.beschreibung || '',
    preis: lager.preis || '',
    immich_album_url: lager.immich_album_url || '',
    ist_aktuell: lager.ist_aktuell
  })
  showModal.value = true
}

const saveLager = async () => {
  isSubmitting.value = true

  try {
    // Wenn als aktuell markiert, alle anderen auf nicht-aktuell setzen
    if (form.ist_aktuell) {
      await client
        .from('lager')
        .update({ ist_aktuell: false })
        .neq('id', editingLager.value?.id || '')
    }

    if (editingLager.value) {
      await client
        .from('lager')
        .update(form)
        .eq('id', editingLager.value.id)
    } else {
      await client
        .from('lager')
        .insert(form)
    }

    showModal.value = false
    await refresh()
  } catch (e) {
    console.error(e)
    alert('Fehler beim Speichern')
  } finally {
    isSubmitting.value = false
  }
}

const deleteLager = async (id: string) => {
  if (!confirm('Lager wirklich löschen? Alle zugehörigen Downloads werden ebenfalls gelöscht.')) return

  try {
    await client.from('lager_downloads').delete().eq('lager_id', id)
    await client.from('lager').delete().eq('id', id)
    await refresh()
  } catch (e) {
    console.error(e)
    alert('Fehler beim Löschen')
  }
}

const toggleAktuell = async (lager: any) => {
  try {
    if (!lager.ist_aktuell) {
      // Alle anderen auf nicht-aktuell setzen
      await client.from('lager').update({ ist_aktuell: false }).neq('id', lager.id)
    }
    await client.from('lager').update({ ist_aktuell: !lager.ist_aktuell }).eq('id', lager.id)
    await refresh()
  } catch (e) {
    console.error(e)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-CH')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Lager verwalten</h1>
      <button
        @click="openNewModal"
        class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-400 transition-colors"
      >
        <Plus class="w-5 h-5" />
        Neues Lager
      </button>
    </div>

    <!-- Lager Liste -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="text-left px-6 py-3 text-sm font-medium text-slate-600">Jahr</th>
            <th class="text-left px-6 py-3 text-sm font-medium text-slate-600 hidden sm:table-cell">Datum</th>
            <th class="text-left px-6 py-3 text-sm font-medium text-slate-600 hidden md:table-cell">Titel</th>
            <th class="text-center px-6 py-3 text-sm font-medium text-slate-600">Aktuell</th>
            <th class="text-right px-6 py-3 text-sm font-medium text-slate-600">Aktionen</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="lager in lagerList" :key="lager.id" class="hover:bg-slate-50">
            <td class="px-6 py-4 font-medium text-slate-900">{{ lager.jahr }}</td>
            <td class="px-6 py-4 text-slate-600 hidden sm:table-cell">
              {{ formatDate(lager.datum_von) }} - {{ formatDate(lager.datum_bis) }}
            </td>
            <td class="px-6 py-4 text-slate-600 hidden md:table-cell">
              {{ lager.titel || '-' }}
            </td>
            <td class="px-6 py-4 text-center">
              <button
                @click="toggleAktuell(lager)"
                :class="[
                  'p-2 rounded-lg transition-colors',
                  lager.ist_aktuell ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' : 'text-slate-400 hover:bg-slate-100'
                ]"
              >
                <Star v-if="lager.ist_aktuell" class="w-5 h-5 fill-current" />
                <StarOff v-else class="w-5 h-5" />
              </button>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="openEditModal(lager)"
                  class="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="deleteLager(lager.id)"
                  class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!lagerList?.length">
            <td colspan="5" class="px-6 py-8 text-center text-slate-500">
              Noch keine Lager vorhanden.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showModal = false" />
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-slate-200">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ editingLager ? 'Lager bearbeiten' : 'Neues Lager' }}
          </h2>
        </div>

        <form @submit.prevent="saveLager" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Jahr *</label>
              <input v-model.number="form.jahr" type="number" required class="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Titel</label>
              <input v-model="form.titel" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="z.B. Winterzauber" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Von *</label>
              <input v-model="form.datum_von" type="date" required class="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Bis *</label>
              <input v-model="form.datum_bis" type="date" required class="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Preis</label>
            <input v-model="form.preis" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="z.B. CHF 450.-" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
            <textarea v-model="form.beschreibung" rows="3" class="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Immich Album URL</label>
            <input v-model="form.immich_album_url" type="url" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="https://..." />
          </div>

          <div class="flex items-center gap-2">
            <input v-model="form.ist_aktuell" type="checkbox" id="ist_aktuell" class="rounded" />
            <label for="ist_aktuell" class="text-sm text-slate-700">Als aktuelles Lager markieren</label>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Abbrechen
            </button>
            <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 disabled:opacity-50 transition-colors">
              {{ isSubmitting ? 'Speichern...' : 'Speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
