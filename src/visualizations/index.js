import Analysis from './utils/AudioAnalysis'
export default class Visualizer {
  constructor (element) {
    this.container = element
  }
  load (analysis, meta = null) {
    this.analysis = new Analysis(analysis)
    this.meta = meta
    this.seek(0)
  }
  startTime = 0
  seek (time) {
    this.startTime = window.performance.now() - time
  }
}
