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
             :disabled="numRanges.values.length < 2"
             @click="removeSlider"
             icon="mdi-close"
            />
        </template>
        <v-card-text class="ma-0 pa-0 mb-2" 
         v-if="filterType === FilterType.RangeNumber || filterType === FilterType.RangeNumberMulti">
            <v-range-slider v-for="r in numRanges.values"
             v-model="(r)"
             step="1"
             :min="r[0]"
             :max="r[1]"
             hide-details
             color="blue-grey-lighten-4"
             @change="valueUpdate"
            >
                <template v-slot:prepend>
                    <v-text-field
                        :model-value="r[0]"
                        single-line
                        hide-details
                        variant="underlined"
                    />
                </template>
                <template v-slot:append>
                    <v-text-field
                        :model-value="r[1]"
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
import { FilterType } from '@/types/filter';
import { reactive } from 'vue';

interface Props {
    name : string
    range : [number, number] | [string, number][]
    filterType: FilterType
}
const props = defineProps<Props>()

const numRanges : { values: [number,number][] } = reactive({ values: [props.range as [number,number]] })
// const labelRanges : { values: { range: [string, number][] }[]} = reactive({ values: [{range: props.range as [string,number][]}] })

const emit = defineEmits(['valueUpdate'])

function valueUpdate() {
    if (props.filterType === FilterType.RangeNumber || props.filterType === FilterType.RangeNumberMulti)
        emit('valueUpdate', numRanges.values)
}

function addSlider() {
    if (props.filterType === FilterType.RangeNumber || props.filterType === FilterType.RangeNumberMulti)
        numRanges.values.push(props.range as [number, number])
}

function removeSlider() {
    if (props.filterType === FilterType.RangeNumber || props.filterType === FilterType.RangeNumberMulti)
        numRanges.values.pop()
    // else
    //     labelRanges.values.pop()
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