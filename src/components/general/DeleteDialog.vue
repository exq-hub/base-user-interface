<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <v-dialog
   width="auto"
   v-model="showDialog"
  >
    <template v-slot:activator="{ props }">
      <v-btn 
       :data-eid="'open_delete_dialog_btn_' + id.toString()"
       class="v-btn--flat" 
       density="compact" 
       icon="mdi-close" 
       v-bind="props"
      />
    </template>
    <v-card class="bg-grey-lighten-4">
      <v-card-title class="text-center bg-red">
        Delete {{ title }}
      </v-card-title>
      <v-card-text class="text-center">
        Are you sure you want to delete {{ name }}?
      </v-card-text>
      <v-card-actions
       class="text-center mb-2"
       style="display:block"
      >
        <v-btn 
         :data-eid="'confirm_delete_btn_' + id.toString()"
         class="confirm" 
         @click="emit('submit'); showDialog=false;"
        >
          Yes
        </v-btn>
        <v-divider class="no-bg clr-transparent" :thickness="20" vertical />
        <v-btn class="close" @click="showDialog=false">No</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script setup lang="ts">
import { logEvents } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { ref } from 'vue';

interface Props {
  id: number,
  title: string,
  name: string,
}
const props = defineProps<Props>()
  
const showDialog = ref(false)

const emit = defineEmits(['submit'])

watch(showDialog, (newVal) => {
  if (!newVal) {
    logEvents([{
      ts: Date.now(),
      action: `Close Delete Dialog`,
      session: useAppStore().session,
    }])
  } else {
    logEvents([{
      ts: Date.now(),
      action: 'Open Delete Dialog for'+props.title,
      session: useAppStore().session,
    }])
  }
})

</script>


<style scoped>
:deep(.v-btn__content) {
  font-weight: bold;
}

.confirm:hover {
  color: #81C784
}
.close:hover {
  color: #E57373
}
</style>
