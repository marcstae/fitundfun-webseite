<script setup lang="ts">
import { Calendar, ExternalLink } from 'lucide-vue-next'

useHead({
  title: 'Archiv - Fit & Fun',
})

const client = useSupabaseClient()

// Fetch alle vergangenen Lager
const { data: lagerList } = await useAsyncData('archiv-lager', async () => {
  const { data } = await client
    .from('lager')
    .select('*')
    .eq('ist_aktuell', false)
    .order('jahr', { ascending: false })
  return data || []
})
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-4xl font-bold text-slate-900 mb-8 text-center">Bisherige Lager</h1>

      <div v-if="lagerList && lagerList.length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="lager in lagerList"
          :key="lager.id"
          :to="`/archiv/${lager.jahr}`"
          class="group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary-300 transition-all"
        >
          <!-- Cover Image Placeholder -->
          <div class="aspect-video bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <span class="text-5xl font-bold text-white/90">{{ lager.jahr }}</span>
          </div>

          <div class="p-4">
            <h3 class="font-semibold text-lg text-slate-900 group-hover:text-primary-700 transition-colors">
              {{ lager.titel || `Lager ${lager.jahr}` }}
            </h3>

            <div class="flex items-center gap-2 mt-2 text-sm text-slate-500">
              <Calendar class="w-4 h-4" />
              <span>{{ lager.jahr }}</span>
            </div>

            <div v-if="lager.immich_album_url" class="flex items-center gap-1 mt-3 text-primary-600 text-sm">
              <ExternalLink class="w-4 h-4" />
              <span>Fotoalbum verfügbar</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="text-center py-12 text-slate-500">
        Noch keine archivierten Lager vorhanden.
      </div>
    </div>
  </div>
</template>
