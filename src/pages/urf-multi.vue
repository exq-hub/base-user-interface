<template>

    <model-bar />

    <!-- Filters/Exclude/Merge -->
    <left-panel :model-id="activeModel.id" />

    <!-- Main -->
    <v-main v-model="activeModel.id">
        <!-- URF 100% -->
    </v-main>

    <!-- Pos/Neg/Hist -->
    <right-panel :model-id="activeModel.id" />
</template>

<script lang="ts" setup>
import ModelBar from '@/components/model/ModelBar.vue';
import LeftPanel from '@/components/model/LeftPanel.vue';
import RightPanel from '@/components/model/RightPanel.vue';
import { useModelStore } from '@/stores/model';

const modelStore = useModelStore()

const activeModel = modelStore.activeModel

</script>