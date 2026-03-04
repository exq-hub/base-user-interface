<template>
  <v-dialog
   v-model="dialog"
   width="50%"
  >
    <template v-slot:activator="{ props }">
      <v-btn
       data-eid="open_settings_form_btn"
       color="text"
       icon="mdi-cog-outline"
       v-bind="props"
      />
    </template>
    <v-card class="bg-indigo text-center ma-2">
      <v-card-title class="mb-2">
        Settings for {{ activeModel!.name }}
      </v-card-title>
      <v-card-actions>
        <edit-text-field 
         :data-eid="'model_name_field_' + activeModel!.id"
         :text="activeModel!.name"
         label="Name"
         @change="updateModelName"
        /> 
      </v-card-actions>
    </v-card>
    <v-card v-if="appStore.evaluations.length > 0" class="bg-indigo text-center ma-2">
      <v-card-title class="mb-2">
        Active Evaluation
      </v-card-title>
      <v-card-actions>
        <v-select
         :data-eid="'select_active_evaluation_dropdown_' + activeModel!.id"
         v-model="appStore.selectedEvaluation"
         :items="appStore.evaluations"
         label="Select Evaluation"
         item-title="name"
         item-value="id"
         return-object
        />
      </v-card-actions>
    </v-card>
    <v-card v-if="appStore.evaluations.length > 0" class="bg-indigo text-center ma-2">
      <v-card-title class="mb-2">
        Q&A Answer
      </v-card-title>
      <v-text-field
       :data-eid="'qa_answer_field_' + activeModel!.id"
       v-model="qaAnswer"
       label="Q&A Answer"
      />
      <v-btn 
       :data-eid="'submit_qa_answer_btn_' + activeModel!.id"
       class="mb-3"
       icon="mdi-check-underline"
       location="bottom center"
       @click="submitTextAnswerVBS"
      />
    </v-card>
  </v-dialog>

  <v-snackbar
   v-model="snackbar"
   :timeout="snackTimeout"
   location="bottom center"
   :color="snackColor"
  >
    {{ text }}
    <template v-slot:actions>
      <v-btn
       variant="text"
       @click="snackbar=false"
       icon="mdi-close"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useModelStore } from '@/stores/model';
import EditTextField from '@/components/general/EditTextField.vue';
import { logEvents, submitAnswer } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';

const modelStore = useModelStore()
const appStore = useAppStore()

const activeModel = computed(() => modelStore.activeModel)

function updateModelName(newName: string) {
  modelStore.updateName(activeModel.value!, newName)
}

const qaAnswer = ref('')

function submitTextAnswerVBS() {
  const requestObject = {
    session_info: {
      session: appStore.session,
      modelId: activeModel.value!.id,
      collection: modelStore.getModelCollection(activeModel.value!.id)
    },
    name: '',
    text: qaAnswer.value, 
    qa: true,
    evalId: appStore.selectedEvaluation.id,
  }
  console.log(requestObject)
  submitAnswer(requestObject)
  snack()
  qaAnswer.value = ''
}

const dialog = ref(false)

// const emit = defineEmits(['submit'])
const snackbar = ref(false)
const snackTimeout = ref(3000)
const snackColor = ref('white')
const text = ref('')

function snack() {
  snackbar.value = true
  snackColor.value = 'success'
  text.value = 'Submitted answer "' + qaAnswer.value + '".'
}

watch(dialog, (newVal) => {
  if (newVal) {
    logEvents([{
      ts: Date.now(),
      action: 'Open Settings Form',
      session: appStore.session,
      element_id: 'settings_form'
    }])
  } else {
    logEvents([{
      ts: Date.now(),
      action: 'Close Settings Form',
      session: appStore.session,
      element_id: 'settings_form'
    }])
  }
})

</script>


<style scoped>

</style>