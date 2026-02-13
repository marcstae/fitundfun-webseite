<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-primary-700 text-white mt-auto">
    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="text-center md:text-left">
          <p class="font-semibold text-lg">Fit & Fun Familien Lager</p>
          <p class="text-primary-200 text-sm">Skilager in Brigels</p>
        </div>

        <div class="flex flex-col md:flex-row items-center gap-4 text-sm text-primary-200">
          <NuxtLink to="/kontakt" class="hover:text-white transition-colors">
            Kontakt
          </NuxtLink>
          <span class="hidden md:inline">•</span>
          <span>&copy; {{ currentYear }} Fit & Fun</span>
        </div>
      </div>
    </div>
  </footer>
</template>
