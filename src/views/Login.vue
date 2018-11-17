<template>
  <div id="login-container">
    <div id="title-container">
      <h1 class="font-effect-anaglyph">Gather Rocks</h1>
      <h3>Bring the exhilaration of music to the gathering of people</h3>
    </div>
    <div id="btn-container">
      <button @click="spotifyLogin">
        <font-awesome-icon :icon="['fab', 'spotify']" size="lg" />
        <span>Login</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  methods: {
    spotifyLogin () {
      this.$emit('login')
    }
  }
}
</script>

<style scoped lang="stylus">
#login-container
  user-select none
  height 100%
  display flex
  flex-direction column
  justify-content center
  #title-container
    text-align center
    h1
      font-family 'Audiowide', sans-serif
      font-size 10vw
    h3
      font-family 'Jura', sans-serif
      font-size 3vw
  #btn-container
    display flex
    flex-direction row
    justify-content center
    button
      cursor pointer
      margin 2rem
      height 3rem
      padding-left 2rem
      padding-right 2rem
      border none
      border-radius 1.5rem
      background-color #1db954
      color white
      transition-duration 0.4s
      &:hover
        background-color #1ed760
      text-transform uppercase
      svg
        margin-right: 0.25rem
</style>
