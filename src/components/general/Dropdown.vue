<template>
    <div class="drop">
        <button @click="toggle" v-click-away="away">{{ rname.name }}</button>
        <div class="opts" v-if="active">
            <div class="dropContent" v-for="opt in options" v-if="active" @click="selectOption(opt)">
                {{ opt }}
            </div> 
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref, reactive } from 'vue'
interface Props {
    name: string,
    options: string[]
}
const props = defineProps<Props>()

const active = ref(false)

const rname = reactive({ name: props.name })

function toggle() {
    active.value = !active.value;
}

function away() {
    active.value = false;
}

function selectOption(option: string) {
    rname.name = option;
}
</script>


<style scoped>
.drop {
    max-height: 10px;
}

button {
    display: inline-block;
    min-width: 150px;
    background: lightgrey;
    border: 0;
    border-radius: 4px;
}

.dropContent {
    position: relative;
    display: block;
    background: var(--color-background);
    text-align: center;
    border-radius: 4px;
    z-index: 2;
}

.dropContent:hover {
    background: rgba(21, 101, 192, 0.12);
    color: #1565C0;
}
</style>