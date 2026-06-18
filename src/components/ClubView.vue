<script lang="ts">
export default {
  setup() {
    const msg: string = 'This is Club Build View'

    return {
      msg,
    }
  },
}
</script>

<template>
  <div>
    <h1>{{ msg }}</h1>
  </div>
</template>

<style lang="css" scoped></style>
