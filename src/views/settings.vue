<template>
  <section>
    <h1>{{ t('settings.title') }}</h1>

    <div class="card" style="margin-top:12px">
      <label class="muted" for="lang">{{ t('settings.language') }}</label>
      <select id="lang" v-model="lang" @change="saveLang">
        <option value="de">Deutsch</option>
        <option value="en">English</option>
      </select>
    </div>

    <div class="card" style="margin-top:12px">
      <button class="iconbtn" @click="logout">{{ t('settings.logout') }}</button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLang, setLang, t } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const lang = ref('de')

onMounted(()=> { lang.value = getLang() })
function saveLang(){ setLang(lang.value); location.reload() }
async function logout(){ await supabase.auth.signOut(); router.push('/') }
</script>
