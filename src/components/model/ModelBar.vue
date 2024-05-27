<template>
    <v-app-bar
     class="bg-amber-darken-3 panel"
    >
        <v-tabs 
         class="mr-2" 
         v-model="activeModel"
         @update:model-value="modelStore.updateActiveModel(activeModel.id)"
        >
            <v-tab 
             v-for="m in models" 
             :key="m.id" 
             :value="m"
            >
                {{ m.name }}
                <v-divider class="no-bg clr-transparent" :thickness="5" vertical /> 
                <delete-dialog
                 :id="m.id"
                 :name="m.name"
                 title="Model"
                 @submit="deleteModel(m)"
                />
            </v-tab>
        </v-tabs>
        <div class="mr-2">
            <v-btn 
            color="black" 
            style="background-color: white;" 
            density="compact" 
            @click="addModel" 
            icon="mdi-plus" />
        </div>
        <v-spacer></v-spacer>
        <settings-form />
    </v-app-bar>
</template>

<script lang="ts" setup>
import DeleteDialog from '@/components/general/DeleteDialog.vue';
import SettingsForm from '@/components/model/SettingsForm.vue';
import { useModelStore } from '@/stores/model';
import { useAppStore } from '@/stores/app'
import { computed, ref } from 'vue';
import Model from '@/types/model';
import { useItemStore } from '@/stores/item';
import { defineEmits } from 'vue/dist/vue.js';

// Stores
const appStore = useAppStore()

const modelStore = useModelStore()
const models = computed(() => modelStore.models)

const activeModel = ref(modelStore.activeModel)

const emit = defineEmits(['modelChange'])

function addModel (name?: string) {
    modelStore.addModel(appStore.session, name)
    activeModel.value = modelStore.activeModel
}

async function deleteModel(model: Model) {
    if (models.value.length === 1) return
    useItemStore().removeModelFromItems(model.id)
    modelStore.deleteModel(appStore.session, model)
    activeModel.value = modelStore.activeModel
} 

</script>

<style scoped>

</style>