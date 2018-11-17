<template>
  <div id="visualization">
    <div id="btn-container">
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Visualizer from '@/visualizations'
export default {
  name: 'visualization',
  props: {
    provider: Object
  },
  mounted () {
    const visualizer = new Visualizer(this.$el)
    visualizer.init(null)
    Promise.all([
      axios.get('/test.json'),
      axios.get('/test.lrc')
    ]).then(([analysisResponse, lyricsResponse]) => {
      visualizer.load(analysisResponse.data, lyricsResponse.data, 0)
    })
  },
  methods: {
    logout () {
      this.$emit('logout')
    }
  }
}
</script>

<style scoped lang="stylus">
#visualization
  height 100%
  #btn-container
    opacity 0
    transition: opacity 0.3s
    &:hover
      opacity 1
    position absolute
    right 0
    bottom 0
    button
      cursor pointer
      margin 1rem
      height 2rem
      padding-left 1rem
      padding-right 1rem
      border none
      border-radius 0.5rem
      background-color #b9613c
      color white
      transition-duration 0.4s
      &:hover
        background-color #d70008
      text-transform uppercase
</style>
