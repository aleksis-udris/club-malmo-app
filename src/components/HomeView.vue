<script lang="ts">
export default {
  setup() {
    const msg: string = 'msg'

    return {
      msg,
    }
  },
}
const isHome: boolean = true
console.log(isHome)
</script>

<template>
  <div>{{ msg }}</div>
</template>

<style scoped></style>
