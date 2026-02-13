<script setup lang="ts">
import { Plus, Pencil, Trash2, Upload, GripVertical } from 'lucide-vue-next'
import { validateImageFile, generateUniqueFilename } from '~/composables/useFileValidation'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Sponsoren verwalten - Fit & Fun Admin',
})

const client = useSupabaseClient()

// Fetch Sponsoren
const { data: sponsoren, refresh } = await useAsyncData('admin-sponsoren', async () => {
  const { data } = await client
    .from('sponsoren')
    .select('*')
    .order('reihenfolge')
  return data || []
})

// Modal State
const showModal = ref(false)
const editingSponsor = ref<any>(null)
const form = reactive({
  name: '',
  website_url: '',
  logo_url: ''
})
const isSubmitting = ref(false)
const logoFile = ref<File | null>(null)

const openNewModal = () => {
  editingSponsor.value = null
  Object.assign(form, { name: '', website_url: '', logo_url: '' })
  logoFile.value = null
  showModal.value = true
}

const openEditModal = (sponsor: any) => {
  editingSponsor.value = sponsor
  Object.assign(form, {
    name: sponsor.name,
    website_url: sponsor.website_url || '',
    logo_url: sponsor.logo_url || ''
  })
  logoFile.value = null
  showModal.value = true
}

const handleLogoChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    const file = target.files[0]
    
    // Validate file before accepting
    const validation = validateImageFile(file)
    if (!validation.valid) {
      alert(validation.error)
      target.value = ''
      return
    }
    
    logoFile.value = file
  }
}

const saveSponsor = async () => {
  if (!form.name) return

  isSubmitting.value = true

  try {
    let logoPath = form.logo_url

    // Logo hochladen wenn neue Datei
    if (logoFile.value) {
      const fileName = `sponsoren/${generateUniqueFilename(logoFile.value.name)}`
      const { error } = await client.storage.from('images').upload(fileName, logoFile.value)
      if (error) throw error
      logoPath = fileName

      // Altes Logo löschen
      if (editingSponsor.value?.logo_url) {
        await client.storage.from('images').remove([editingSponsor.value.logo_url])
      }
    }

    const sponsorData = {
      name: form.name,
      website_url: form.website_url || null,
      logo_url: logoPath || null
    }

    if (editingSponsor.value) {
      await client.from('sponsoren').update(sponsorData).eq('id', editingSponsor.value.id)
    } else {
      const maxOrder = sponsoren.value?.length || 0
      await client.from('sponsoren').insert({ ...sponsorData, reihenfolge: maxOrder + 1 })
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

const deleteSponsor = async (sponsor: any) => {
  if (!confirm(`"${sponsor.name}" wirklich löschen?`)) return

  try {
    if (sponsor.logo_url) {
      await client.storage.from('images').remove([sponsor.logo_url])
    }
    await client.from('sponsoren').delete().eq('id', sponsor.id)
    await refresh()
  } catch (e) {
    console.error(e)
    alert('Fehler beim Löschen')
  }
}

const { getPublicUrl } = useStorageUrl()

const getLogoUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return getPublicUrl('images', path)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Sponsoren verwalten</h1>
      <button
        @click="openNewModal"
        class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-400 transition-colors"
      >
        <Plus class="w-5 h-5" />
        Neuer Sponsor
      </button>
    </div>

    <!-- Sponsoren Liste -->
    <div class="bg-white rounded-xl border border-slate-200">
      <div class="divide-y divide-slate-200">
        <div
          v-for="sponsor in sponsoren"
          :key="sponsor.id"
          class="p-4 flex items-center gap-4"
        >
          <GripVertical class="w-5 h-5 text-slate-400 cursor-grab" />

          <div class="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              v-if="sponsor.logo_url"
              :src="getLogoUrl(sponsor.logo_url)"
              :alt="sponsor.name"
              class="max-w-full max-h-full object-contain"
            />
            <span v-else class="text-2xl font-bold text-slate-400">{{ sponsor.name.charAt(0) }}</span>
          </div>

          <div class="flex-1">
            <p class="font-medium text-slate-900">{{ sponsor.name }}</p>
            <p v-if="sponsor.website_url" class="text-sm text-slate-500 truncate">
              {{ sponsor.website_url }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="openEditModal(sponsor)"
              class="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              @click="deleteSponsor(sponsor)"
              class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="!sponsoren?.length" class="p-8 text-center text-slate-500">
          Noch keine Sponsoren vorhanden.
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showModal = false" />
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="p-6 border-b border-slate-200">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ editingSponsor ? 'Sponsor bearbeiten' : 'Neuer Sponsor' }}
          </h2>
        </div>

        <form @submit.prevent="saveSponsor" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
            <input
              v-model="form.website_url"
              type="url"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="https://..."
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Logo</label>
            <div v-if="form.logo_url && !logoFile" class="mb-2">
              <img :src="getLogoUrl(form.logo_url)" alt="Logo" class="h-16 object-contain" />
            </div>
            <label class="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer w-fit">
              <Upload class="w-4 h-4" />
              {{ logoFile ? logoFile.name : 'Logo auswählen' }}
              <input type="file" accept="image/*" class="hidden" @change="handleLogoChange" />
            </label>
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
