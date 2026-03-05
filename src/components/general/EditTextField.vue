<template>
  <v-text-field 
  variant="outlined"
  :readonly="!editText"
  :label="label"
  v-model="field"
  >
    <template v-slot:append-inner>
      <v-icon v-if="!editText" @click="toggleEditText">
        mdi-square-edit-outline
      </v-icon>
      <template v-else>
        <v-icon color="success" @click="textChanged" icon="mdi-check-circle-outline"/>
        <v-divider class="clr-transparent" :thickness="5" vertical></v-divider>
        <v-icon color="error" @click="resetText" icon="mdi-close-circle-outline"/>
      </template>
    </template>
  </v-text-field>
</template>


<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  text: string
  label?: string
  textColor?: string
}
const props = defineProps<Props>()
  let field = props.text
  
  const editText = ref(false)
  const toggleEditText = () => editText.value = !editText.value
  
  const emit = defineEmits(['change'])
  function textChanged() {
    toggleEditText()
    emit('change', field)
  }
  
  function resetText() {
    toggleEditText()
    field = props.text
  }
  
</script>


<style scoped>
.v-text-field {
  margin: auto;
  max-width: 40%;
}
.v-text-field :deep(input) {
  text-align: center;
}

</style>