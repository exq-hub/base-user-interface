// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */
import { createRouter, createWebHistory } from 'vue-router'
import SearchView from '@/pages/MainView.vue'
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


