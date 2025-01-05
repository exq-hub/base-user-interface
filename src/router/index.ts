/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
// import { createRouter, createWebHistory } from 'vue-router/auto'
// import { setupLayouts } from 'virtual:generated-layouts'

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   extendRoutes: setupLayouts,
// })

// export default router

// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import SearchView from '@/pages/SearchView.vue'
import HomeView from '@/pages/HomeView.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/search',
        name: 'search',
        component: SearchView,
    },
]

export default createRouter({
    history: createWebHistory(),
    routes,
})


