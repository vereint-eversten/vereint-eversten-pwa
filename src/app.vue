<template>
  <div class="app">
    <TopBar />

    <main class="page">
      <router-view />
    </main>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import TopBar from './components/TopBar.vue'
import BottomNav from './components/BottomNav.vue'
</script>
