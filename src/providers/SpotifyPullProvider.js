import axios from 'axios'
import Cached from '@/utils/cache'

class SpotifyPullProvider {
  constructor () {
    this.pullingInterval = 5000
    this.client = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 10000,
      headers: {},
    })
    this.client.interceptors.request.use(config => {
      config.headers['Authorization'] = 'Bearer ' + this.accessKey.get()
      return config
    })
    this.accessKey = new Cached('SpotifyAccessKey')

    this.target = null
  }

  start () {
    this._puller = setInterval(this.pull.bind(this), this.pullingInterval)
    this.pull()
  }

  stop () {
    if (!this._puller) {
      return
    }
    clearInterval(this._puller)
  }
  async pull () {
    if (!this.target) { return }
    const response = await this.client.get('me/player/currently-playing')
    const playback = response.data
    if (!playback.is_playing) {
      // TODO: Not playing anything.
      return
    }
    const track = playback.item
    if (this.track && (this.track.id === track.id)) {
      // Still play the last one
      this.target.seek(playback.progress_ms)
      return
    }
    this.track = track
    this.target.load(track, this, playback.progress_ms)
  }
  async getLyrics (track) {
    if (!track) track = this.track
    let response = await axios.get(`https://api.imjad.cn/cloudmusic/?type=search&search_type=1&s=${track.name + ' ' + track.artists.map(a => a.name).join(' ')}`)
    if (!response.data.result.songs) return null
    const id = response.data.result.songs[0].id
    response = await axios.get(`https://api.imjad.cn/cloudmusic/?type=lyric&id=${id}`)
    return response && response.data && response.data.lrc && response.data.lrc.lyric
  }
  getAnalysis (track) {
    if (!track) track = this.track
    return this.client.get(`/audio-analysis/${track.id}`)
      .then(response => response.data)
  }
  getPalette (track) {
    if (!track) track = this.track
    return axios.get('//app.gather.rocks/utils/imgcolor/' + track.id)
      .then(response => response.data.map(hexCode => '#' + hexCode))
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
