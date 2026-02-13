<script setup lang="ts">
import { Download, ExternalLink, Calendar, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const jahr = route.params.jahr as string

useHead({
  title: `Lager ${jahr} - Fit & Fun`,
})

const client = useSupabaseClient()

// Fetch Lager by Jahr
const { data: lager } = await useAsyncData(`lager-${jahr}`, async () => {
  const { data } = await client
    .from('lager')
    .select('*')
    .eq('jahr', parseInt(jahr))
    .single()
  return data
})

// Fetch Downloads
const { data: downloads } = await useAsyncData(`downloads-${jahr}`, async () => {
  if (!lager.value?.id) return []
  const { data } = await client
    .from('lager_downloads')
    .select('*')
    .eq('lager_id', lager.value.id)
    .order('reihenfolge')
  return data || []
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const { getPublicUrl } = useStorageUrl()

const getDownloadUrl = (filePath: string) => {
  return getPublicUrl('pdfs', filePath)
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-4xl mx-auto">
      <!-- Back Link -->
      <NuxtLink to="/archiv" class="inline-flex items-center gap-2 text-slate-600 hover:text-primary-700 mb-8">
        <ArrowLeft class="w-4 h-4" />
        Zurück zum Archiv
      </NuxtLink>

      <div v-if="lager">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-slate-900 mb-4">
            {{ lager.titel || `Lager ${lager.jahr}` }}
          </h1>

          <div class="flex items-center gap-2 text-slate-600">
            <Calendar class="w-5 h-5 text-primary-600" />
            <span>{{ formatDate(lager.datum_von) }} - {{ formatDate(lager.datum_bis) }}</span>
          </div>
        </div>

        <!-- Beschreibung -->
        <div v-if="lager.beschreibung" class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <p class="text-slate-700 leading-relaxed whitespace-pre-line">{{ lager.beschreibung }}</p>
        </div>

        <!-- Downloads -->
        <div v-if="downloads && downloads.length > 0" class="mb-8">
          <h2 class="text-2xl font-semibold text-slate-900 mb-6">Downloads</h2>
          <div class="grid sm:grid-cols-2 gap-4">
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

        <!-- Fotoalbum -->
        <div v-if="lager.immich_album_url" class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
          <h2 class="text-xl font-semibold mb-2">Fotoalbum</h2>
          <p class="text-primary-100 mb-4">Alle Fotos vom Lager {{ lager.jahr }} ansehen und herunterladen.</p>
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

      <!-- Not Found -->
      <div v-else class="text-center py-12">
        <p class="text-slate-600 text-lg">Lager {{ jahr }} nicht gefunden.</p>
        <NuxtLink to="/archiv" class="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
          ← Zurück zum Archiv
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
