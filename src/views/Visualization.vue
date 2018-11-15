<template>
  <div id="visualization"></div>
</template>

<script>
import axios from 'axios'
import Visualizer from '@/visualizations'
export default {
  name: 'visualization',
  mounted () {
    const visualizer = new Visualizer(this.$el)
    visualizer.init(null)
    Promise.all([
      axios.get('/test.json'),
      axios.get('/test.lrc')
    ]).then(([analysisResponse, lyricsResponse]) => {
      visualizer.load(analysisResponse.data, lyricsResponse.data, 0)
    })
  }
}
</script>

<style>
#visualization {
  height: 100%;
}
</style>
