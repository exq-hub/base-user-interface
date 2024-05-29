<template>
    <v-dialog
     v-model="dialog"
     width="50%">
        <template v-slot:activator="{ props }">
            <v-btn
             color="black"
             icon="mdi-cog-outline"
             v-bind="props"
             />
        </template>
        <v-card class="bg-indigo text-center ma-2">
            <v-card-title class="mb-2">
                Settings for {{ activeModel.name }}
            </v-card-title>
            <v-card-actions>
                <edit-text-field 
                 :text="activeModel.name"
                 label="Name"
                 @change="updateModelName"
                 /> 
            </v-card-actions>
        </v-card>
        <v-card class="bg-indigo text-center ma-2">
            <v-card-title class="mb-2">
                Evaluation Id
            </v-card-title>
            <v-card-actions>
                <edit-text-field 
                 :text="appStore.evalId"
                 label="Name"
                 @change="changeEvalId"
                 /> 
            </v-card-actions>
        </v-card>
        <v-card class="bg-indigo text-center ma-2">
            <v-card-title class="mb-2">
                Q&A Answer (VBS)
            </v-card-title>
                <v-text-field
                 v-model="qaAnswer"
                 label="Q&A Answer"
                />
                <v-btn 
                 class="mb-3"
                 icon="mdi-check-underline"
                 location="bottom center"
                 @click="submitTextAnswerVBS">
                </v-btn>
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
import { submitAnswer } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';

const modelStore = useModelStore()
const appStore = useAppStore()

const activeModel = computed(() => modelStore.activeModel)

function updateModelName(newName: string) {
    modelStore.updateName(activeModel.value, newName)
}

const qaAnswer = ref('')

function changeEvalId(newId: string) {
    appStore.setEvaluationId(newId)
}

function submitTextAnswerVBS() {
    const requestObject = {
        sessionId: appStore.session,
        modelId: activeModel.value.id,
        name: '',
        text: qaAnswer.value, 
        qa: true,
        evalId: appStore.evalId
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
</script>


<style scoped>

</style>