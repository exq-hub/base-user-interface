<template>
    <!-- Tabular bar for models -->
    <model-bar />

    <!-- Filters/Exclude/Merge -->
    <left-panel />

    <!-- Main -->
    <v-main>
        <v-container fluid class="d-flex">
            <chat />
            <urf-grid />
        </v-container>
    </v-main>

    <!-- Pos/Neg/Hist -->
    <right-panel />
</template>


<script lang="ts" setup>
import ModelBar from '@/components/model/ModelBar.vue';
import LeftPanel from '@/components/model/LeftPanel.vue';
import RightPanel from '@/components/model/RightPanel.vue';
import Chat from '@/components/model/Chat.vue';
import UrfGrid from '@/components/model/URFGrid.vue';
import { initSession } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { useModelStore } from '@/stores/model';
import { useFilterStore } from '@/stores/filter';

const appStore = useAppStore()
const modelStore = useModelStore()
const sessionobj = await initSession()
appStore.session = sessionobj.session
appStore.evaluations = sessionobj.evaluations
modelStore.totalItems = sessionobj.totalItems
modelStore.initializeModelItems(0)
useFilterStore().loadFilters(0)

</script>
