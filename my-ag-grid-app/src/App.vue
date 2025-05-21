<script setup lang="ts">
import TreeTable from './components/TreeTable.vue'
import { TreeStore } from './services/TreeStore'

const store = new TreeStore()
</script>

<template>
  <div class="app-container">
    <TreeTable />
  </div>
</template>

<style scoped>
.app-container {
  padding: 10px;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
}
</style>
