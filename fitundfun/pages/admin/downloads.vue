<script setup lang="ts">
import { Plus, Trash2, Upload, FileText, GripVertical } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Downloads verwalten - Fit & Fun Admin',
})

const client = useSupabaseClient()

// Fetch alle Lager für Dropdown
const { data: lagerList } = await useAsyncData('admin-lager-dropdown', async () => {
  const { data } = await client
    .from('lager')
    .select('id, jahr, titel')
    .order('jahr', { ascending: false })
  return data || []
})

// Ausgewähltes Lager
const selectedLagerId = ref('')

// Fetch Downloads für ausgewähltes Lager
const { data: downloads, refresh } = await useAsyncData('admin-downloads', async () => {
  if (!selectedLagerId.value) return []
  const { data } = await client
    .from('lager_downloads')
    .select('*')
    .eq('lager_id', selectedLagerId.value)
    .order('reihenfolge')
  return data || []
}, { watch: [selectedLagerId] })

// Modal State
const showModal = ref(false)
const form = reactive({
  titel: '',
  file: null as File | null
})
const isUploading = ref(false)

const openUploadModal = () => {
  form.titel = ''
  form.file = null
  showModal.value = true
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    form.file = target.files[0]
    if (!form.titel) {
      form.titel = form.file.name.replace(/\.pdf$/i, '')
    }
  }
}

const uploadFile = async () => {
  if (!form.file || !form.titel || !selectedLagerId.value) return

  isUploading.value = true

  try {
    // Datei hochladen
    const fileName = `${selectedLagerId.value}/${Date.now()}-${form.file.name}`
    const { error: uploadError } = await client.storage
      .from('pdfs')
      .upload(fileName, form.file)

    if (uploadError) throw uploadError

    // Download-Eintrag erstellen
    const maxOrder = downloads.value?.length || 0
    await client.from('lager_downloads').insert({
      lager_id: selectedLagerId.value,
      titel: form.titel,
      file_path: fileName,
      reihenfolge: maxOrder + 1
    })

    showModal.value = false
    await refresh()
  } catch (e) {
    console.error(e)
    alert('Fehler beim Hochladen')
  } finally {
    isUploading.value = false
  }
}

const deleteDownload = async (download: any) => {
  if (!confirm(`"${download.titel}" wirklich löschen?`)) return

  try {
    // Datei aus Storage löschen
    await client.storage.from('pdfs').remove([download.file_path])
    // Eintrag löschen
    await client.from('lager_downloads').delete().eq('id', download.id)
    await refresh()
  } catch (e) {
    console.error(e)
    alert('Fehler beim Löschen')
  }
}

// Erstes Lager vorauswählen
watch(lagerList, (list) => {
  if (list?.length && !selectedLagerId.value) {
    selectedLagerId.value = list[0].id
  }
}, { immediate: true })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Downloads verwalten</h1>
    </div>

    <!-- Lager Auswahl -->
    <div class="bg-white rounded-xl p-6 border border-slate-200 mb-6">
      <label class="block text-sm font-medium text-slate-700 mb-2">Lager auswählen</label>
      <select
        v-model="selectedLagerId"
        class="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg"
      >
        <option value="" disabled>Bitte wählen...</option>
        <option v-for="lager in lagerList" :key="lager.id" :value="lager.id">
          {{ lager.jahr }} {{ lager.titel ? `- ${lager.titel}` : '' }}
        </option>
      </select>
    </div>

    <!-- Downloads Liste -->
    <div v-if="selectedLagerId" class="bg-white rounded-xl border border-slate-200">
      <div class="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 class="font-semibold text-slate-900">PDFs</h2>
        <button
          @click="openUploadModal"
          class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-400 transition-colors text-sm"
        >
          <Upload class="w-4 h-4" />
          PDF hochladen
        </button>
      </div>

      <div class="divide-y divide-slate-200">
        <div
          v-for="download in downloads"
          :key="download.id"
          class="p-4 flex items-center gap-4"
        >
          <GripVertical class="w-5 h-5 text-slate-400 cursor-grab" />
          <div class="p-2 bg-orange-100 rounded-lg">
            <FileText class="w-5 h-5 text-orange-600" />
          </div>
          <div class="flex-1">
            <p class="font-medium text-slate-900">{{ download.titel }}</p>
            <p class="text-sm text-slate-500">{{ download.file_path.split('/').pop() }}</p>
          </div>
          <button
            @click="deleteDownload(download)"
            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <div v-if="!downloads?.length" class="p-8 text-center text-slate-500">
          Noch keine Downloads für dieses Lager.
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showModal = false" />
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="p-6 border-b border-slate-200">
          <h2 class="text-xl font-semibold text-slate-900">PDF hochladen</h2>
        </div>

        <form @submit.prevent="uploadFile" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
            <input
              v-model="form.titel"
              type="text"
              required
              class="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="z.B. Anmeldeformular"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">PDF-Datei *</label>
            <input
              type="file"
              accept=".pdf"
              required
              @change="handleFileChange"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Abbrechen
            </button>
            <button type="submit" :disabled="isUploading || !form.file" class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 disabled:opacity-50 transition-colors">
              {{ isUploading ? 'Lädt hoch...' : 'Hochladen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
