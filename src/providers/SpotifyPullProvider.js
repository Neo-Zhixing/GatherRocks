import axios from 'axios'
import Cached from '@/utils/cache'

class SpotifyPullProvider {
  constructor (view) {
    this.pullingInterval = 5000
    this.client = axios.create({
      baseURL: 'https://api.spotify.com/v1/',
      timeout: 10000,
      headers: {},
    })
    this.accessKey = new Cached('SpotifyAccessKey')
  }

  start () {
    this._puller = setInterval(this.pull, this.pullingInterval)
  }

  stop () {
    if (!this._puller) {
      return
    }
    clearInterval(this._puller)
  }

  pull () {
  }
  login () {
    return new Promise((resolve, reject) => {
      const newWindow = window.open(
        process.env.VUE_APP_BACKEND_HOST + '/spotify/auth/login',
        'spotify-login',
        'height=500,width=700'
      )
      if (window.focus) newWindow.focus()
      const spotifyLoginCallback = (event) => {
        if (event.origin !== process.env.VUE_APP_BACKEND_HOST) {
          return
        }
        window.removeEventListener('message', spotifyLoginCallback, false)
        this.accessKey.set(event.data.spotify.access_token, event.data.spotify.expires_in)
        resolve()
      }
      window.addEventListener('message', spotifyLoginCallback, false)
    })
  }
  logout () {
    this.accessKey.flush()
  }
  get loggedIn () {
    return !!this.accessKey.get()
  }
}
export default SpotifyPullProvider
