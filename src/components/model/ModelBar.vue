<template>
    <v-app-bar
     class="bg-amber-darken-3 panel"
    >
        <v-tabs 
         class="mr-2" 
         v-model="activeModel"
         @update:model-value="modelStore.updateActiveModel(activeModel!.id); emit('modelChange')"
        >
            <v-tab 
             v-for="m in models" 
             :data-eid="'model_tab_' + m.id.toString()"
             :key="m.id" 
             :value="m"
            >
                {{ m.name }}
                <v-divider class="border-opacity-0" :thickness="5" vertical /> 
                <delete-dialog
                 :id="m.id"
                 :name="m.name"
                 title="Model"
                 @submit="deleteModel(m)"
                />
            </v-tab>
        </v-tabs>
        <add-model-dialog 
         @confirm="addModel"
         :available-collections="appStore.collections"
        /> 
        <v-spacer></v-spacer>
        <settings-form /> 
    </v-app-bar>
</template>

<script lang="ts" setup>
import AddModelDialog from './AddModelDialog.vue';
import DeleteDialog from '@/components/general/DeleteDialog.vue';
import SettingsForm from '@/components/model/SettingsForm.vue';
import { useModelStore } from '@/stores/model';
import { useAppStore } from '@/stores/app'
import { computed, ref } from 'vue';
import Model from '@/types/model';
import { useItemStore } from '@/stores/item';

// Stores
const appStore = useAppStore()

const modelStore = useModelStore()
const models = computed(() => modelStore.models)

const activeModel = ref(modelStore.activeModel)

const emit = defineEmits(['modelChange'])

async function addModel (collection: string, name?: string) {
    modelStore.addModel(appStore.session, collection, false, name)
    console.log(modelStore.activeModel!)
    activeModel.value = modelStore.activeModel
    emit('modelChange')
}

async function deleteModel(model: Model) {
    if (models.value.length === 1) return
    useItemStore().removeModelFromItems(model.id)
    modelStore.deleteModel(appStore.session, model)
    activeModel.value = modelStore.activeModel
    emit('modelChange')
} 

</script>

<style scoped>

</style>