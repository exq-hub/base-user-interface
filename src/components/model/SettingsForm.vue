<template>
  <v-dialog v-model="dialog" width="760">
    <template #activator="{ props }">
      <v-btn
       data-eid="open_settings_form_btn"
       icon="mdi-cog-outline"
       variant="text"
       v-bind="props"
      />
    </template>

    <v-card rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-bold">
          Settings
        </div>

        <v-btn icon variant="text" @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-tabs v-model="tab" density="comfortable">
          <v-tab value="general">General</v-tab>
          <v-tab value="model">Model</v-tab>
          <v-tab v-if="appStore.evaluations.length > 0" value="competition">Competition</v-tab>
        </v-tabs>

        <v-divider class="my-3" />

        <v-window v-model="tab">
          <!-- General -->
          <v-window-item value="general">
            <div class="text-subtitle-2 font-weight-bold mb-2">Theme</div>
            <div class="d-flex flex-wrap ga-3 align-center mb-5">
              <v-select
               v-model="appStore.themeId"
               :items="themePresets"
               label="Theme preset"
               variant="outlined"
               density="comfortable"
               style="max-width: 260px"
               hide-details
              />
            </div>

            <div class="text-subtitle-2 font-weight-bold mb-2">Thumbnails</div>
            <div class="mb-2 text-caption opacity-70">
              Global thumbnail size used for search results.
            </div>
            <v-slider
             v-model="appStore.globalThumbSize"
             :min="120"
             :max="320"
             :step="10"
             thumb-label="always"
             density="comfortable"
             color="indigo"
            />
          </v-window-item>

          <!-- Model -->
          <v-window-item value="model">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              Model: {{ activeModel?.name }}
            </div>

            <div class="mb-3">
              <edit-text-field
               :data-eid="'model_name_field_' + activeModel!.id"
               :text="activeModel!.name"
               label="Model name"
               @change="updateModelName"
              />
            </div>

            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                 :data-eid="'items_to_show_' + activeModel!.id"
                 v-model.number="itemsToShow"
                 type="number"
                 label="Items per search"
                 variant="outlined"
                 density="comfortable"
                 hide-details
                 @blur="applyModelSettings"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                 :data-eid="'max_thumb_size_' + activeModel!.id"
                 v-model.number="maxThumbSize"
                 type="number"
                 label="Max thumbnail size"
                 variant="outlined"
                 density="comfortable"
                 hide-details
                 @blur="applyModelSettings"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                 :data-eid="'resources_' + activeModel!.id"
                 v-model="resources"
                 :items="resourceOptions"
                 label="Resources"
                 variant="outlined"
                 density="comfortable"
                 hide-details
                 @update:model-value="applyModelSettings"
                />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Competition -->
          <v-window-item v-if="appStore.evaluations.length > 0" value="competition">
            <div class="text-subtitle-2 font-weight-bold mb-2">Active Evaluation</div>
            <v-select
             :data-eid="'select_active_evaluation_dropdown_' + activeModel!.id"
             v-model="appStore.selectedEvaluation"
             :items="appStore.evaluations"
             label="Select Evaluation"
             item-title="name"
             item-value="id"
             return-object
             variant="outlined"
             density="comfortable"
            />

            <v-divider class="my-4" />

            <div class="text-subtitle-2 font-weight-bold mb-2">Q&A Answer</div>
            <v-text-field
             :data-eid="'qa_answer_field_' + activeModel!.id"
             v-model="qaAnswer"
             label="Q&A Answer"
             variant="outlined"
             density="comfortable"
             hide-details
             @keyup.enter="submitTextAnswerVBS"
            />

            <div class="mt-3">
              <v-btn
               :data-eid="'submit_qa_answer_btn_' + activeModel!.id"
               color="primary"
               variant="flat"
               @click="submitTextAnswerVBS"
              >
                Submit answer
              </v-btn>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :timeout="snackTimeout" location="bottom center" :color="snackColor">
    {{ text }}
    <template #actions>
      <v-btn variant="text" @click="snackbar=false" icon="mdi-close" />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useModelStore } from '@/stores/model'
import EditTextField from '@/components/general/EditTextField.vue'
import { logEvents, submitAnswer } from '@/services/ExquisitorAPI'
import { useAppStore } from '@/stores/app'
import { ResourceValues } from '@/types/model'

const modelStore = useModelStore()
const appStore = useAppStore()
const vuetifyTheme = useTheme()

const activeModel = computed(() => modelStore.activeModel)

const dialog = ref(false)
const tab = ref<'general'|'model'|'competition'>('general')

const themePresets = ['light', 'graphiteDark', 'softDark']

// apply theme changes
watch(
  () => appStore.themeId,
  () => {
    if (appStore.themeId === 'light') vuetifyTheme.global.name.value = 'light'
    else vuetifyTheme.global.name.value = appStore.themeId
  },
  { immediate: true }
)

// Model settings local fields
const itemsToShow = ref<number>(50)
const maxThumbSize = ref<number>(300)
const resources = ref<ResourceValues>(ResourceValues.Low)

const resourceOptions = [
  { title: 'Low', value: ResourceValues.Low },
  { title: 'Medium', value: ResourceValues.Medium },
  { title: 'High', value: ResourceValues.High },
]

watch(activeModel, (m) => {
  if (!m) return
  itemsToShow.value = m.settings.itemsToShow
  resources.value = m.settings.resources
}, { immediate: true })

function updateModelName(newName: string) {
  if (!activeModel.value) return
  modelStore.updateName(activeModel.value, newName)
}

function applyModelSettings() {
  if (!activeModel.value) return
  modelStore.updateModelSettings(activeModel.value.id, {
    itemsToShow: Number(itemsToShow.value),
    resources: resources.value,
  })
}

// Competition QA
const qaAnswer = ref('')
const snackbar = ref(false)
const snackTimeout = ref(3000)
const snackColor = ref('white')
const text = ref('')

function snack(msg: string) {
  snackbar.value = true
  snackColor.value = 'success'
  text.value = msg
}

function submitTextAnswerVBS() {
  if (!activeModel.value) return
  const requestObject = {
    session_info: {
      session: appStore.session,
      modelId: activeModel.value.id,
      collection: modelStore.getModelCollection(activeModel.value.id),
    },
    name: '',
    text: qaAnswer.value,
    qa: true,
    evalId: appStore.selectedEvaluation.id,
  }
  submitAnswer(requestObject)
  snack(`Submitted answer "${qaAnswer.value}".`)
  qaAnswer.value = ''
}

// logging open/close
watch(dialog, (newVal) => {
  logEvents([{
    ts: Date.now(),
    action: newVal ? 'Open Settings Form' : 'Close Settings Form',
    session: appStore.session,
    element_id: 'settings_form'
  }])
})
</script>

<style scoped>
:deep(.v-slider-thumb__label) {
  background: rgb(175, 163, 209) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
}
</style>