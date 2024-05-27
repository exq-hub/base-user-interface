<template>
    
    <!-- Filters & Exclude -->
    <left-panel :model-id="activeModel.id"/>

    <v-main>
        <!-- URF 100% -->
    </v-main>

    <!-- Pos/Neg/Hist -->
    <right-panel :model-id="activeModel.id"/>

</template>

<script lang="ts" setup>
import LeftPanel from '@/components/model/LeftPanel.vue';
import RightPanel from '@/components/model/RightPanel.vue';
import { useModelStore } from '@/stores/model';

const modelStore = useModelStore()

const activeModel = modelStore.activeModel

</script>