import Visualizer from '.'
import * as TWEEN from '@tweenjs/tween.js'
import Color from './utils/color'

import Game from './game'

import Patterns from './ConwayPatterns.json'
export default class Conway extends Visualizer {
  constructor (element, ...args) {
    super(element, ...args)
    this.canvas = document.createElement('canvas')
    this.canvas.id = 'conway'
    this.canvas.width = element.clientWidth
    this.canvas.height = element.clientHeight
    element.appendChild(this.canvas)

    this.ctx = this.canvas.getContext('2d')
    this.data = new Game(10, 10)
    this.data.loadPattern(Patterns.gun, 3, 3)
  }
  color = new Color(0, 0, 0)
  size = 10
  spawnSize = 0
  killSize = 5
  nextFrame (duration) {
    this.data.next()
    this.spawnSize = 0
    this.killSize = this.size / 2
    new TWEEN.Tween(this)
      .to({ spawnSize: this.size / 2, killSize: 0 }, duration * 0.8)
      .onUpdate(this.draw.bind(this))
      .start()
  }
  draw () {
    const radius = this.size / 2
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = this.color.toRGBFunc()
    this.ctx.beginPath()
    this.data.forEach((x, y, val, lastVal) => {
      x = x * this.size + radius
      y = y * this.size + radius
      this.ctx.moveTo(x, y)
      if (val) {
        this.ctx.arc(x, y, lastVal ? radius : this.spawnSize, 0, 2 * Math.PI)
      } else if (lastVal) {
        this.ctx.arc(x, y, this.killSize, 0, 2 * Math.PI)
      }
    })
    this.ctx.fill()
  }
  update (time) {
    super.update(time)
    TWEEN.update(time)
    const playtime = (time - this.startTime) / 1000

    let val = this.analysis.check('beats', playtime)
    if (val) this.onBeat(val)
    val = this.analysis.check('segments', playtime)
    if (val) this.onSegments(val)
    val = this.analysis.check('sections', playtime)
    if (val) this.onSections(val)
  }
  onBeat (beat) {
    this.nextFrame(beat.duration * 1000)
    // setInterval(this.nextFrame().bind(this), 1000)
  }
  onSegments (segment) {
    new TWEEN.Tween(this.color)
      .to(Color.fromPitches(segment.pitches), segment.duration * 1000 * 0.8)
      .start()
  }
  onSections (section) {
    console.log(section)
    //this.data.populateRandom()
  }
  get background () {
    return new Color(this.canvas.style['background-color'])
  }
  set background (val) {
    this.canvas.style['background-color'] = val.toColorCode()
  }
}
