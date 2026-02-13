<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'

useHead({
  title: 'Lagerhaus - Fit & Fun',
})

const client = useSupabaseClient()

// Fetch Lagerhaus Info
const { data: lagerhaus } = await useAsyncData('lagerhaus', async () => {
  const { data } = await client
    .from('lagerhaus')
    .select('*')
    .single()
  return data
})

const { getPublicUrl } = useStorageUrl()

const getImageUrl = (path: string) => {
  if (path.startsWith('http')) return path
  return getPublicUrl('images', path)
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-slate-900 mb-4">
          {{ lagerhaus?.titel || 'Lagerhaus Crestneder' }}
        </h1>
        <div class="flex items-center justify-center gap-2 text-slate-600">
          <MapPin class="w-5 h-5 text-primary-600" />
          <span>Brigels, Graubünden</span>
        </div>
      </div>

      <!-- Bilder Gallery -->
      <div v-if="lagerhaus?.bilder && lagerhaus.bilder.length > 0" class="mb-12">
        <div class="grid md:grid-cols-2 gap-4">
          <img
            v-for="(bild, index) in lagerhaus.bilder"
            :key="index"
            :src="getImageUrl(bild)"
            :alt="`Lagerhaus Bild ${index + 1}`"
            class="rounded-xl w-full h-64 object-cover"
          />
        </div>
      </div>

      <!-- Placeholder wenn keine Bilder -->
      <div v-else class="mb-12">
        <div class="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
          <MapPin class="w-16 h-16 text-primary-400" />
        </div>
      </div>

      <!-- Beschreibung -->
      <div v-if="lagerhaus?.beschreibung" class="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <p class="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
          {{ lagerhaus.beschreibung }}
        </p>
      </div>

      <!-- Fallback Content -->
      <div v-else class="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <p class="text-slate-700 leading-relaxed text-lg">
          Das Lagerhaus Crestneder in Brigels bietet den perfekten Rahmen für unser Familienlager.
          Mitten in den Bündner Bergen gelegen, ist es der ideale Ausgangspunkt für Skifahren,
          Snowboarden und viele weitere Winteraktivitäten.
        </p>
      </div>
    </div>
  </div>
</template>
