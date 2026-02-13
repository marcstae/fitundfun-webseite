<script setup lang="ts">
import { Save, Upload, Trash2 } from 'lucide-vue-next'
import { validateImageFile, generateUniqueFilename } from '~/composables/useFileValidation'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Einstellungen - Fit & Fun Admin',
})

const client = useSupabaseClient()

// Fetch Settings
const { data: settings, refresh } = await useAsyncData('admin-settings', async () => {
  const { data } = await client
    .from('settings')
    .select('*')
    .single()
  return data
})

const form = reactive({
  site_title: '',
  contact_email: '',
  hero_image_url: ''
})

// Form mit bestehenden Daten füllen
watch(settings, (data) => {
  if (data) {
    form.site_title = data.site_title || ''
    form.contact_email = data.contact_email || ''
    form.hero_image_url = data.hero_image_url || ''
  }
}, { immediate: true })

const isSaving = ref(false)
const isUploading = ref(false)

const saveSettings = async () => {
  isSaving.value = true

  try {
    if (settings.value) {
      await client
        .from('settings')
        .update(form)
        .eq('id', settings.value.id)
    } else {
      await client
        .from('settings')
        .insert(form)
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

const uploadHeroImage = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return

  const file = target.files[0]
  
  // Validate file before upload
  const validation = validateImageFile(file)
  if (!validation.valid) {
    alert(validation.error)
    target.value = ''
    return
  }

  isUploading.value = true

  try {
    const fileName = `hero/${generateUniqueFilename(file.name)}`

    // Altes Bild löschen
    if (form.hero_image_url && !form.hero_image_url.startsWith('http')) {
      await client.storage.from('images').remove([form.hero_image_url])
    }

    const { error } = await client.storage.from('images').upload(fileName, file)
    if (error) throw error

    form.hero_image_url = fileName
  } catch (_e) {
    alert('Fehler beim Hochladen')
  } finally {
    isUploading.value = false
    target.value = ''
  }
}

const removeHeroImage = async () => {
  if (form.hero_image_url && !form.hero_image_url.startsWith('http')) {
    await client.storage.from('images').remove([form.hero_image_url])
  }
  form.hero_image_url = ''
}

const { getPublicUrl } = useStorageUrl()

const getImageUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return getPublicUrl('images', path)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Einstellungen</h1>
      <button
        @click="saveSettings"
        :disabled="isSaving"
        class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-400 disabled:opacity-50 transition-colors"
      >
        <Save class="w-5 h-5" />
        {{ isSaving ? 'Speichern...' : 'Speichern' }}
      </button>
    </div>

    <div class="space-y-6 max-w-2xl">
      <!-- Site Title -->
      <div class="bg-white rounded-xl p-6 border border-slate-200">
        <label class="block text-sm font-medium text-slate-700 mb-2">Website-Titel</label>
        <input
          v-model="form.site_title"
          type="text"
          class="w-full px-3 py-2 border border-slate-200 rounded-lg"
          placeholder="Fit & Fun Familien Lager"
        />
        <p class="text-sm text-slate-500 mt-2">Wird im Browser-Tab und in Suchmaschinen angezeigt.</p>
      </div>

      <!-- Contact Email -->
      <div class="bg-white rounded-xl p-6 border border-slate-200">
        <label class="block text-sm font-medium text-slate-700 mb-2">Kontakt E-Mail</label>
        <input
          v-model="form.contact_email"
          type="email"
          class="w-full px-3 py-2 border border-slate-200 rounded-lg"
          placeholder="kontakt@fitundfun.ch"
        />
        <p class="text-sm text-slate-500 mt-2">Öffentliche E-Mail-Adresse für Kontaktanfragen.</p>
      </div>

      <!-- Hero Image -->
      <div class="bg-white rounded-xl p-6 border border-slate-200">
        <label class="block text-sm font-medium text-slate-700 mb-2">Hero-Hintergrundbild</label>

        <div v-if="form.hero_image_url" class="relative mb-4">
          <img
            :src="getImageUrl(form.hero_image_url)"
            alt="Hero Image"
            class="w-full h-48 object-cover rounded-lg"
          />
          <button
            @click="removeHeroImage"
            class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <label class="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer w-fit">
          <Upload class="w-4 h-4" />
          {{ isUploading ? 'Lädt hoch...' : 'Bild hochladen' }}
          <input
            type="file"
            accept="image/*"
            class="hidden"
            :disabled="isUploading"
            @change="uploadHeroImage"
          />
        </label>

        <p class="text-sm text-slate-500 mt-2">Wird auf der Startseite im Hero-Bereich angezeigt (empfohlen: 1920x1080).</p>
      </div>
    </div>
  </div>
</template>
