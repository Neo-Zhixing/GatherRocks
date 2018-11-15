<template>
  <visualization/>
</template>

<script>
import Visualization from './views/Visualization.vue'

export default {
  name: 'app',
  components: {
    Visualization
  }
}
</script>

<style>
html, body {
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
}
</style>
