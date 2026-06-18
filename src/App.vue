<script setup lang="ts">
import SideBar from './components/SideBar.vue'
</script>

<template>
  <main>
    <body>
      <SideBar />
      <router-view></router-view>
    </body>
  </main>
</template>

<style scoped>
SideBar {
  align-self: flex-end;
}
router-view {
  flex: 1;
  min-width: 80vw;
  min-height: 80vw;
}
</style>
