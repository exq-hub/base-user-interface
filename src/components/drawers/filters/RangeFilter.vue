<template>
    <v-card color="white">
        <template v-slot:title>
            <v-card-title class="text-body-1">
                {{ name }}
            </v-card-title>
        </template>
        <template v-slot:append>
            <v-btn
             variant="plain"
             density="compact"
             x-small
             @click="addSlider"
             icon="mdi-plus"
            >
            </v-btn>
            <v-btn
             variant="plain"
             density="compact"
             x-small
             :disabled="ranges.values.length < 2"
             @click="removeSlider"
             icon="mdi-close"
            />
        </template>
        <v-card-text class="ma-0 pa-0 mb-2">
            <v-range-slider v-for="r in ranges.values"
             v-model="r.range"
             step="1"
             :min="range[0]"
             :max="range[1]"
             hide-details
             color="blue-grey-lighten-4"
             @change="valueUpdate"
            >
                <template v-slot:prepend>
                    <v-text-field
                        :model-value="r.range[0]"
                        single-line
                        hide-details
                        variant="underlined"
                    />
                </template>
                <template v-slot:append>
                    <v-text-field
                        :model-value="r.range[1]"
                        single-line
                        hide-details
                        variant="underlined"
                    />
                </template>

            </v-range-slider>
        </v-card-text>
    </v-card>
</template>


<script setup lang="ts">
import { reactive } from 'vue';

interface Props {
    name : string
    range : [number,number]
}
const props = defineProps<Props>()

const ranges = reactive({ values: [{range: props.range}] })

const emit = defineEmits(['valueUpdate'])

function valueUpdate() {
    emit('valueUpdate', ranges.values)
}

function addSlider() {
    ranges.values.push({ range: props.range })
}

function removeSlider() {
    ranges.values.pop()
}
</script>


<style scoped>
.v-card-title {
    color: black;
}
.v-text-field :deep(.v-field__input) {
    padding: 0px;
    margin: 0px;
    max-height: fit-content;
    min-height: 0px;
}
.v-text-field :deep(input) {
    text-align: center;
}
</style>