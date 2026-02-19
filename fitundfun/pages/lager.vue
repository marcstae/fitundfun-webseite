<script setup lang="ts">
import { Download, ExternalLink, Calendar, MapPin } from 'lucide-vue-next'

useHead({
  title: 'Aktuelles Lager - Fit & Fun',
})

const client = useSupabaseClient()

// Fetch aktuelles Lager
const { data: lager } = await useAsyncData('lager-aktuell', async () => {
  const { data } = await client
    .from('lager')
    .select('*')
    .eq('ist_aktuell', true)
    .single()
  return data
})

// Fetch Downloads für aktuelles Lager
const { data: downloads } = await useAsyncData('lager-downloads', async () => {
  if (!lager.value?.id) return []
  const { data } = await client
    .from('lager_downloads')
    .select('*')
    .eq('lager_id', lager.value.id)
    .order('reihenfolge')
  return data || []
})

const { formatDate } = useFormat()

const { getPublicUrl } = useStorageUrl()

const getDownloadUrl = (filePath: string) => {
  return getPublicUrl('pdfs', filePath)
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Header -->
    <div class="max-w-4xl mx-auto mb-12 text-center">
      <h1 class="text-4xl font-bold text-slate-900 mb-4">
        Lager {{ lager?.jahr || new Date().getFullYear() }}
      </h1>

      <div v-if="lager" class="flex flex-wrap justify-center gap-6 text-slate-600">
        <div class="flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary-600" />
          <span>{{ formatDate(lager.datum_von) }} - {{ formatDate(lager.datum_bis) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <MapPin class="w-5 h-5 text-primary-600" />
          <span>Brigels, Crestneder</span>
        </div>
      </div>
    </div>

    <div v-if="lager" class="max-w-4xl mx-auto">
      <!-- Beschreibung -->
      <div v-if="lager.beschreibung" class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
        <p class="text-slate-700 leading-relaxed whitespace-pre-line">{{ lager.beschreibung }}</p>
      </div>

      <!-- Preis -->
      <div v-if="lager.preis" class="bg-primary-50 rounded-xl p-6 border border-primary-200 mb-8">
        <p class="text-primary-800 font-semibold">
          Preis: {{ lager.preis }}
        </p>
      </div>

      <!-- Downloads -->
      <div v-if="downloads && downloads.length > 0" class="mb-8">
        <h2 class="text-2xl font-semibold text-slate-900 mb-6">Downloads</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            v-for="download in downloads"
            :key="download.id"
            :href="getDownloadUrl(download.file_path)"
            target="_blank"
            class="flex items-center gap-3 bg-white rounded-lg p-4 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group"
          >
            <div class="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Download class="w-5 h-5 text-orange-600" />
            </div>
            <span class="font-medium text-slate-700 group-hover:text-orange-600 transition-colors">
              {{ download.titel }}
            </span>
          </a>
        </div>
      </div>

      <!-- Fotoalbum Link -->
      <div v-if="lager.immich_album_url" class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h2 class="text-xl font-semibold mb-2">Fotoalbum</h2>
        <p class="text-primary-100 mb-4">Alle Fotos vom Lager ansehen, herunterladen und eigene hochladen.</p>
        <a
          :href="lager.immich_album_url"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
        >
          Zum Fotoalbum
          <ExternalLink class="w-4 h-4" />
        </a>
      </div>
    </div>

    <!-- Kein Lager -->
    <div v-else class="max-w-2xl mx-auto text-center py-12">
      <p class="text-slate-600 text-lg">
        Informationen zum nächsten Lager werden bald veröffentlicht.
      </p>
      <NuxtLink to="/kontakt" class="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
        Bei Fragen kontaktiere uns →
      </NuxtLink>
    </div>
  </div>
</template>
