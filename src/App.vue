<template>
    <suspense>
        <v-app>
            <v-main>
                <router-view />
            </v-main>
        </v-app>
    </suspense>
</template>

<script lang="ts" setup>
import router from './router';
import { initSession } from './services/ExquisitorAPI';
import { useAppStore } from './stores/app';
import { createTracker } from './tracker';

onMounted(async () => {
    await fetchInfo()
})

const appStore = useAppStore()
async function fetchInfo() {
    try {
        const sessionobj = await initSession()
        appStore.session = sessionobj.session
        appStore.evaluations = sessionobj.evaluations
        sessionobj.collections.forEach((val) => appStore.collections.push({name: val}))
    } catch (err) {
        appStore.success = false
        console.error('Failed to initialise session:', err)
    }
}

createTracker({
    getRoute: () => router.currentRoute.value.fullPath,
})
</script>
