<template>
  <section>
    <h1>{{ t('home.title') }}</h1>
    <p class="muted">{{ t('home.subtitle') }}</p>

    <div class="card" style="margin-top:16px">
      <h2>🗓 Nächste Termine</h2>
      <p class="muted">Platzhalter – Kalender folgt.</p>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>💬 Letzte Nachrichten</h2>
      <p class="muted">Platzhalter – Messenger Vorschau.</p>
    </div>
  </section>
</template>
<script setup>
import { t } from '../lib/i18n'
</script>
