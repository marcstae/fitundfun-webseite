<script setup lang="ts">
import { Mountain, Mail, Calendar } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Dashboard - Fit & Fun Admin',
})

const client = useSupabaseClient()

// Fetch aktuelles Lager
const { data: aktuellesLager } = await useAsyncData('admin-aktuelles-lager', async () => {
  const { data } = await client
    .from('lager')
    .select('*')
    .eq('ist_aktuell', true)
    .single()
  return data
})

// Fetch ungelesene Nachrichten
const { data: ungeleseneNachrichten } = await useAsyncData('admin-ungelesen', async () => {
  const { data, count } = await client
    .from('kontakt_nachrichten')
    .select('*', { count: 'exact', head: true })
    .eq('gelesen', false)
  return count || 0
})

// Fetch Anzahl Lager
const { data: lagerCount } = await useAsyncData('admin-lager-count', async () => {
  const { count } = await client
    .from('lager')
    .select('*', { count: 'exact', head: true })
  return count || 0
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-slate-900 mb-8">Dashboard</h1>

    <!-- Stats -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- Aktuelles Lager -->
      <div class="bg-white rounded-xl p-6 border border-slate-200">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary-100 rounded-lg">
            <Mountain class="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">Aktuelles Lager</p>
            <p v-if="aktuellesLager" class="font-semibold text-slate-900">
              {{ aktuellesLager.jahr }}
            </p>
            <p v-else class="text-slate-400">Nicht gesetzt</p>
          </div>
        </div>
      </div>

      <!-- Ungelesene Nachrichten -->
      <NuxtLink to="/admin/nachrichten" class="bg-white rounded-xl p-6 border border-slate-200 hover:border-primary-300 transition-colors">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-orange-100 rounded-lg">
            <Mail class="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">Ungelesene Nachrichten</p>
            <p class="font-semibold text-slate-900">{{ ungeleseneNachrichten }}</p>
          </div>
        </div>
      </NuxtLink>

      <!-- Anzahl Lager -->
      <NuxtLink to="/admin/lager" class="bg-white rounded-xl p-6 border border-slate-200 hover:border-primary-300 transition-colors">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 rounded-lg">
            <Calendar class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">Lager insgesamt</p>
            <p class="font-semibold text-slate-900">{{ lagerCount }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Aktuelles Lager Details -->
    <div v-if="aktuellesLager" class="bg-white rounded-xl p-6 border border-slate-200">
      <h2 class="text-xl font-semibold text-slate-900 mb-4">Aktuelles Lager</h2>
      <div class="space-y-2 text-slate-600">
        <p><span class="font-medium">Jahr:</span> {{ aktuellesLager.jahr }}</p>
        <p><span class="font-medium">Datum:</span> {{ formatDate(aktuellesLager.datum_von) }} - {{ formatDate(aktuellesLager.datum_bis) }}</p>
        <p v-if="aktuellesLager.titel"><span class="font-medium">Titel:</span> {{ aktuellesLager.titel }}</p>
      </div>
      <NuxtLink
        to="/admin/lager"
        class="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
      >
        Lager bearbeiten →
      </NuxtLink>
    </div>

    <!-- Kein Lager -->
    <div v-else class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
      <p class="text-yellow-800">
        Es ist noch kein aktuelles Lager festgelegt.
        <NuxtLink to="/admin/lager" class="font-medium underline">Jetzt festlegen</NuxtLink>
      </p>
    </div>
  </div>
</template>
