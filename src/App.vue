<template>
  <visualization
    v-if="loggedIn"
    :provider="provider"
    @logout="logout" />
  <login
    v-else
    @login="login" />
</template>

<script>
import Visualization from '@/views/Visualization.vue'
import Login from '@/views/Login.vue'
import SpotifyPullProvider from './providers/SpotifyPullProvider'
export default {
  name: 'app',
  data: () => ({
    loggedIn: false,
  }),
  mounted () {
    this.provider = new SpotifyPullProvider()
    this.loggedIn = this.provider.loggedIn
  },
  methods: {
    login () {
      this.provider.login()
        .then(() => {
          this.loggedIn = true
        })
    },
    logout () {
      this.provider.logout()
      this.loggedIn = false
    },
  },
  components: {
    Visualization,
    Login,
  }
}
</script>

<style>
@import url('//fonts.googleapis.com/css?family=Jura|Roboto|Audiowide&effect=anaglyph');
html, body {
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  font-family: 'Roboto', sans-serif;
}
</style>
