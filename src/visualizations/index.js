import Analysis from './utils/AudioAnalysis'
import Lyrics from './utils/lyrics'
export default class Visualizer {
  provider = null
  constructor (element) {
    this.container = element
  }
  load (track, provider) {
    this.track = track
    this.provider = provider
    this.seek(0)
  }
  startTime = 0
  seek (time) {
    this.startTime = window.performance.now() - time
  }
  loadAnalysis () {
    return this.provider.getAnalysis()
      .then(analysis => {
        this.analysis = analysis ? new Analysis(analysis) : null
        return this.analysis
      })
  }
  loadLyrics () {
    return this.provider.getLyrics()
      .then(lyrics => {
        this.lyrics = lyrics ? new Lyrics(lyrics) : null
        return this.lyrics
      })
  }

  color = {
    dark: '#871b42',
    primary: '#000000',
    vibrant: '#871b42',
  }
  loadPalette () {
    this.provider.getPalette()
      .then(palette => {
        this.color = {
          dark: palette[0],
          primary: palette[1],
          vibrant: palette[2],
        }
        return this.color
      })
  }
}
