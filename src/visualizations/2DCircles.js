import Two from 'two.js'
import * as TWEEN from '@tweenjs/tween.js'
import Visualizer from '.'

export default class CircleVisualizer extends Visualizer {
  constructor (element, ...args) {
    super(element, ...args)
    const params = {
      fullscreen: true,
      type: Two.Types.webgl,
      autostart: true,
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

    new TWEEN.Tween(circle.linewidth)
      .to(1000, 1000)
      .easing(TWEEN.Easing.Linear.None)
      .start()
    rect.noStroke()

    function animate(time) {
      requestAnimationFrame(animate)
      TWEEN.update(time)
    }
    requestAnimationFrame(animate)
  }
  update (time) {
    TWEEN.update(time)
  }
}
