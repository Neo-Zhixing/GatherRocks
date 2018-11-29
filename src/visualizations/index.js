import Analysis from './utils/AudioAnalysis'
export default class Visualizer {
  constructor (element) {
    this.container = element
  }
  loaded = false
  load (analysis, meta = null) {
    this.analysis = new Analysis(analysis)
    this.meta = meta
    this.seek(0)
    if (!this.loaded) {
      this.loaded = true
      this.onLoad()
      requestAnimationFrame(this.update.bind(this))
    }
  }
  startTime = 0
  seek (time) {
    this.startTime = window.performance.now() - time
  }
  onLoad () {}
  update () {
    requestAnimationFrame(this.update.bind(this))
  }
}
