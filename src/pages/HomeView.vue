<template>
    <v-container class="d-flex flex-column align-center justify-center" style="min-height: 100vh">
        <v-icon size="72" color="primary" class="mb-3">mdi-database-search</v-icon>
        <h1 class="text-h3 font-weight-bold mb-1">Exquisitor</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Multimedia Search &amp; Relevance Feedback</p>

        <v-alert v-if="!appStore.success" type="error" class="mb-6" style="max-width: 600px; width: 100%">
            Could not connect to the Exquisitor backend. Check that the server is running and reachable.
        </v-alert>

        <div style="max-width: 900px; width: 100%">
            <h2 class="text-h6 text-medium-emphasis text-center mb-4">Select a Collection</h2>

            <!-- Skeleton loaders while collections are fetching -->
            <v-row v-if="collections.length === 0 && appStore.success">
                <v-col v-for="i in 3" :key="i" cols="12" md="6" lg="4">
                    <v-skeleton-loader type="card" />
                </v-col>
            </v-row>

            <v-row v-else>
                <v-col
                    v-for="collection in collections"
                    :key="collection.name"
                    cols="12"
                    md="6"
                    lg="4"
                >
                    <v-card
                        :data-eid="'collection_btn_' + collection.name"
                        @click="onSelectCollection(collection.name)"
                        class="mb-4"
                        :elevation="2"
                        hover
                    >
                        <v-card-title>{{ collection.name }}</v-card-title>
                        <v-card-text>
                            <div>{{ collection.description }}</div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app';
import { useModelStore } from '@/stores/model';
import { useRouter } from 'vue-router'

const router = useRouter()
const appStore = useAppStore()
const { collections } = storeToRefs(appStore)
const modelStore = useModelStore()

async function onSelectCollection(collection: string) {
    modelStore.addModel(appStore.session, collection, true)
    router.push({ name: 'search' })
}
</script>
