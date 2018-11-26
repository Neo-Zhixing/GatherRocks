export default class Visualizer {
  constructor (element) {
    this.container = element
  }
  load (analysis, meta = null) {
    this.analysis = analysis
    this.meta = meta
  }
  seek (time) {
  }
}
