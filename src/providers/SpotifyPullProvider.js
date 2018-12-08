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
    const t0 = performance.now()
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
    let [analysis, lyrics] = await Promise.all([
      this.client.get(`/audio-analysis/${track.id}`),
      axios.get(`https://api.imjad.cn/cloudmusic/?type=search&search_type=1&s=${track.name + ' ' + track.artists.map(a => a.name).join(' ')}`)
        .then(response => {
          if (!response.data.result.songs) return null
          const id = response.data.result.songs[0].id
          return axios.get(`https://api.imjad.cn/cloudmusic/?type=lyric&id=${id}`)
        })
    ]).then(([analysis, lyrics]) => [analysis.data, lyrics && lyrics.data])
    lyrics = lyrics && lyrics.lrc && lyrics.lrc.lyric
    const t1 = performance.now()
    this.target.load(
      analysis,
      lyrics,
      playback.progress_ms + (t1 - t0),
      track.album.images[0].url,
      track.name + ' - ' + track.artists[0])
    this.target.seek(playback.progress_ms + (t1 - t0))
    return 0
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
