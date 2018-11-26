import Two from 'two.js'
import * as TWEEN from '@tweenjs/tween.js'
import Visualizer from '.'

export default class CircleVisualizer extends Visualizer {
  constructor (element, ...args) {
    super(element, ...args)
    const params = {
      fullscreen: false,
      width: 300,
      height: 300,
      type: Two.Types.webgl,
    }
    this.renderer = new Two(params)
      .appendTo(element)
    const circle = this.renderer.makeCircle(72, 100, 50)
    const rect = this.renderer.makeRectangle(213, 100, 100, 100)

    circle.fill = '#FF8000'
    circle.stroke = 'orangered'
    circle.linewidth = 5

    rect.fill = 'rgb(0, 200, 255)'
    rect.opacity = 0.75
    rect.noStroke()
  }
  loaded = false
  load () {
    super.load(...arguments)
    if (!this.loaded) {
      this.loaded = true
      requestAnimationFrame(this.update.bind(this))
    }
  }
  update (time) {
    requestAnimationFrame(this.update.bind(this))
    TWEEN.update(time)
    this.renderer.update()

    const playtime = (time - this.startTime) / 1000
    const onBeat = this.analysis.check('beats', playtime)
    if (onBeat) {
      console.log('beat', playtime)
    }
  }
}
