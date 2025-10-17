import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

import Home from '../views/Home.vue'
import Project from '../views/Project.vue'
import Calendar from '../views/Calendar.vue'
import Messenger from '../views/Messenger.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'home', component: Home, meta: { titleKey: 'home.metaTitle' } },
  { path: '/project', name: 'project', component: Project, meta: { titleKey: 'project.metaTitle' } },
  { path: '/calendar', name: 'calendar', component: Calendar, meta: { titleKey: 'calendar.metaTitle' } },
  { path: '/messenger', name: 'messenger', component: Messenger, meta: { requiresAuth: true, titleKey: 'messenger.metaTitle' } },
  { path: '/settings', name: 'settings', component: Settings, meta: { titleKey: 'settings.metaTitle' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const store = useUserStore()
  await store.ensureSession()
  if (to.meta?.requiresAuth && !store.user) {
    return { name: 'home', query: { redirect: to.fullPath } }
  }
})

export default router
