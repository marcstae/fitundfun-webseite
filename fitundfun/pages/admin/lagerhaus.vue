<script setup lang="ts">
import { Save, Upload, Trash2, ImageIcon } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Lagerhaus bearbeiten - Fit & Fun Admin',
})

const client = useSupabaseClient()

// Fetch Lagerhaus
const { data: lagerhaus, refresh } = await useAsyncData('admin-lagerhaus', async () => {
  const { data } = await client
    .from('lagerhaus')
    .select('*')
    .single()
  return data
})

const form = reactive({
  titel: '',
  beschreibung: '',
  bilder: [] as string[]
})

// Form mit bestehenden Daten füllen
watch(lagerhaus, (data) => {
  if (data) {
    form.titel = data.titel || ''
    form.beschreibung = data.beschreibung || ''
    form.bilder = data.bilder || []
  }
}, { immediate: true })

const isSaving = ref(false)
const isUploading = ref(false)

const saveLagerhaus = async () => {
  isSaving.value = true

  try {
    if (lagerhaus.value) {
      await client
        .from('lagerhaus')
        .update({
          titel: form.titel,
          beschreibung: form.beschreibung,
          bilder: form.bilder
        })
        .eq('id', lagerhaus.value.id)
    } else {
      await client
        .from('lagerhaus')
        .insert({
          titel: form.titel,
          beschreibung: form.beschreibung,
          bilder: form.bilder
        })
    }

    await refresh()
    alert('Gespeichert!')
  } catch (e) {
    console.error(e)
    alert('Fehler beim Speichern')
  } finally {
    isSaving.value = false
  }
}

const uploadImage = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return

  isUploading.value = true

  try {
    const file = target.files[0]
    const fileName = `lagerhaus/${Date.now()}-${file.name}`

    const { error } = await client.storage
      .from('images')
      .upload(fileName, file)

    if (error) throw error

    form.bilder.push(fileName)
  } catch (e) {
    console.error(e)
    alert('Fehler beim Hochladen')
  } finally {
    isUploading.value = false
    target.value = ''
  }
}

const removeImage = async (index: number) => {
  const path = form.bilder[index]

  try {
    await client.storage.from('images').remove([path])
    form.bilder.splice(index, 1)
  } catch (e) {
    console.error(e)
  }
}

const { getPublicUrl } = useStorageUrl()

const getImageUrl = (path: string) => {
  return getPublicUrl('images', path)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Lagerhaus bearbeiten</h1>
      <button
        @click="saveLagerhaus"
        :disabled="isSaving"
        class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-400 disabled:opacity-50 transition-colors"
      >
        <Save class="w-5 h-5" />
        {{ isSaving ? 'Speichern...' : 'Speichern' }}
      </button>
    </div>

    <div class="space-y-6">
      <!-- Titel -->
      <div class="bg-white rounded-xl p-6 border border-slate-200">
        <label class="block text-sm font-medium text-slate-700 mb-2">Titel</label>
        <input
          v-model="form.titel"
          type="text"
          class="w-full px-3 py-2 border border-slate-200 rounded-lg"
          placeholder="z.B. Lagerhaus Crestneder"
        />
      </div>

      <!-- Beschreibung -->
      <div class="bg-white rounded-xl p-6 border border-slate-200">
        <label class="block text-sm font-medium text-slate-700 mb-2">Beschreibung</label>
        <textarea
          v-model="form.beschreibung"
          rows="8"
          class="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
          placeholder="Beschreibung des Lagerhauses..."
        />
      </div>

      <!-- Bilder -->
      <div class="bg-white rounded-xl p-6 border border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <label class="text-sm font-medium text-slate-700">Bilder</label>
          <label class="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
            <Upload class="w-4 h-4" />
            {{ isUploading ? 'Lädt...' : 'Bild hochladen' }}
            <input
              type="file"
              accept="image/*"
              class="hidden"
              :disabled="isUploading"
              @change="uploadImage"
            />
          </label>
        </div>

        <div v-if="form.bilder.length" class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="(bild, index) in form.bilder"
            :key="index"
            class="relative group"
          >
            <img
              :src="getImageUrl(bild)"
              :alt="`Bild ${index + 1}`"
              class="w-full h-32 object-cover rounded-lg"
            />
            <button
              @click="removeImage(index)"
              class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-32 bg-slate-50 rounded-lg text-slate-400">
          <div class="text-center">
            <ImageIcon class="w-8 h-8 mx-auto mb-2" />
            <p class="text-sm">Noch keine Bilder</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
