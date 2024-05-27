<template>
    <v-main>
        <!-- Chat 100% -->
    </v-main>
</template>

<script lang="ts" setup>
import { useModelStore } from '@/stores/model';

const modelStore = useModelStore()

const activeModel = modelStore.activeModel

</script>