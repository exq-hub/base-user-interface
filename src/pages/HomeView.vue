<template>
    <v-container class="text-center">
        <h1 class="text-h1">Welcome to Exquisitor</h1>
        <br/>
        <v-row>
            <v-col cols="12">
                <h1 class="text-h4">Select a Collection</h1>
            </v-col>
        </v-row>

        <v-row>
            <v-col
                v-for="collection in collections"
                :key="collection.name"
                cols="12"
                md="6"
                lg="4"
            >
                <v-card @click="onSelectCollection(collection.name)" class="mb-4" hover>
                    <v-card-title>{{ collection.name }}</v-card-title>
                    <v-card-text>
                        <div>{{ collection.description }}</div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import { useModelStore } from '@/stores/model';
import { useRouter } from 'vue-router'

const router = useRouter()
const appStore = useAppStore()
const collections = appStore.collections
const modelStore = useModelStore()

async function onSelectCollection(collection: string) {
    modelStore.addModel(appStore.session, collection, true)
    router.push({ name: 'search' })
}
</script>
