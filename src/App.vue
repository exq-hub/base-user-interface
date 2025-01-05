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
import { initSession } from './services/ExquisitorAPI';
import { useAppStore } from './stores/app';

onMounted(async () => {
    await fetchInfo()
})

const appStore = useAppStore()
async function fetchInfo() {
    const sessionobj = await initSession()
    appStore.session = sessionobj.session
    appStore.evaluations = sessionobj.evaluations
    sessionobj.collections.forEach((val) => appStore.collections.push({name: val}))
}

</script>
