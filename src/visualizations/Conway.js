import Visualizer from '.'
import * as TWEEN from '@tweenjs/tween.js'
export default class Conway extends Visualizer {
  constructor (element, ...args) {
    super(element, ...args)
    this.canvas = document.createElement('canvas')
    this.canvas.id = 'conway'
    this.canvas.width = element.clientWidth
    this.canvas.height = element.clientHeight
    element.appendChild(this.canvas)

    this.ctx = this.canvas.getContext('2d')
    this.data = new ConwayCalculator(9, 10)
    this.data.populateRandom()
  }
  size = 10
  spawnSize = 0
  killSize = 5
  nextFrame (duration) {
    this.data.next()
    const radius = this.size / 2
    this.spawnSize = 0
    this.killSize = radius
    new TWEEN.Tween(this)
      .to({ spawnSize: radius, killSize: 0 }, duration * 0.8)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(e => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.fillStyle = 'rgb(0,0,0)'
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
      })
      .start()
  }
  update (time) {
    super.update(time)
    TWEEN.update(time)
    const playtime = (time - this.startTime) / 1000

    const val = this.analysis.check('beats', playtime)
    if (val) this.onBeat(val)
  }
  onBeat (beat) {
    this.nextFrame(beat.duration * 1000)
    // setInterval(this.nextFrame().bind(this), 1000)
  }
}

class ConwayCalculator {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.data = new Uint8Array(width * height * 8)
    this.buffer = new Uint8Array(width * height * 8)
  }
  populateRandom () {
    for (let i = 0; i < this.width * this.height * 8; i++) {
      this.data[i] = Math.floor(Math.random() * 256)
    }
  }
  indexFor (x, y) {
    return y * this.width + ~~(x / 8) // ~~: Math.floor
  }
  cellAt (x, y, data) {
    if (!data) data = this.data
    const block = data[this.indexFor(x, y)]
    // Get x%8 bit on the block
    return ((block >>> (x % 8)) | 0xFE) === 0xFF
  }
  setCellAt (x, y, val, data) {
    if (!data) data = this.data
    const block = data[this.indexFor(x, y)]
    const xBit = x % 8
    const mask = 0x01 << xBit

    data[this.indexFor(x, y)] = val ? block | mask : block & ~mask
  }
  wrapCoords (x, y) {
    if (x < 0) x = 0
    if (x > this.width * 8 - 1) x = this.width * 8 - 1
    if (y < 0) y = 0
    if (y > this.height * 8 - 1) y = this.height * 8 - 1
    return [x, y]
  }
  countLivingNeighbors (x, y, data) {
    return [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1]
    ]
      .map(([xDir, yDir]) => this.cellAt(...this.wrapCoords(x + xDir, y + yDir), data) | 0)
      .reduce((x, sum) => sum + x)
  }
  next () {
    this.buffer.set(this.data)
    for (let x = 0; x < this.width * 8; x++) {
      for (let y = 0; y < this.height * 8; y++) {
        const count = this.countLivingNeighbors(x, y, this.buffer)
        if (this.cellAt(x, y, this.buffer)) {
          if (count < 2 || count > 3) this.setCellAt(x, y, false)
        } else {
          if (count === 3) this.setCellAt(x, y, true)
        }
      }
    }
  }
  forEach (callback) {
    for (let x = 0; x < this.width * 8; x++) {
      for (let y = 0; y < this.height * 8; y++) {
        callback(x, y, this.cellAt(x, y), this.cellAt(x, y, this.buffer))
      }
    }
  }
}
