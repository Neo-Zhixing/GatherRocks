import Two from 'two.js'
import * as TWEEN from '@tweenjs/tween.js'
import Visualizer from '.'

import { getRandomPoint } from './utils/geometry'
import Color from './utils/color'

export default class CircleVisualizer extends Visualizer {
  constructor (element, ...args) {
    super(element, ...args)
    const params = {
      fullscreen: false,
      width: element.clientWidth,
      height: element.clientHeight,
      type: Two.Types.canvas,
    }
    this.renderer = new Two(params)
      .appendTo(element)

    this.background = '#FFFFFF'
  }
  loaded = false
  async load () {
    super.load(...arguments)
    await this.loadAnalysis()
    if (!this.loaded) {
      this.loaded = true
      this.onLoad()
      requestAnimationFrame(this.update.bind(this))
    }
  }
  update (time) {
    super.update(time)
    TWEEN.update(time)
    this.renderer.update()

    const playtime = (time - this.startTime) / 1000

    let val = this.analysis.check('sections', playtime)
    if (val) this.onSection(val)
    val = this.analysis.check('bars', playtime)
    if (val) this.onBar(val)
    val = this.analysis.check('beats', playtime)
    if (val) this.onBeat(val)
  }

  sectionCircle = null
  onSection (section) {
    const point = getRandomPoint(this.container.clientWidth, this.container.clientHeight)
    let duration = section.duration * 1000
    if (duration < 2000) duration /= 2
    else {
      duration = 1000 + (section.loudness * 30)
      if (duration < 100) duration = 100
    }
    const color = Color.random(section)

    this.sectionCircle.fill = color.toRGBFunc()
    this.sectionCircle.translation.set(point.x, point.y)
    new TWEEN.Tween(this.sectionCircle)
      .to({ radius: 1000 }, 2000)
      .easing(TWEEN.Easing.Linear.None)
      .onComplete(() => {
        this.sectionCircle.radius = 0
        this.background = color.toRGBFunc()
      })
      .start()
  }
  onBeat () {

  }
  onBar (bar) {
    const duration = bar.duration * 1000 / 8
    const originalColor = new Color(this.background)
    const shadedColor = originalColor.shaded(-0.4)
    console.log(bar)
    new TWEEN.Tween(originalColor.copy())
      .to(shadedColor, duration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(val => {
        this.background = val.toRGBFunc()
      })
      .onComplete(() => {
        new TWEEN.Tween(shadedColor.copy())
          .to(originalColor, duration)
          .easing(TWEEN.Easing.Quadratic.In)
          .onUpdate(val => {
            this.background = val.toRGBFunc()
          })
          .start()
      })
      .start()
  }
  onLoad () {
    this.sectionCircle = this.renderer.makeCircle(0, 0, 0).noStroke()
  }

  get background () {
    return this.renderer.scene.parent.domElement.style['background-color']
  }
  set background (val) {
    this.renderer.scene.parent.domElement.style['background-color'] = val
  }
}
