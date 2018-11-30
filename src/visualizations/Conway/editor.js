import Game from './game.js'

export default class Editor {
  constructor (canvas, width = 10, height = 10, size = 10) {
    this.width = width
    this.height = height
    this.size = size
    this.canvas = canvas

    canvas.height = height * 8 * size
    canvas.width = width * 8 * size

    this.ctx = canvas.getContext('2d')
    this.game = new Game(10, 10)

    this.canvas.addEventListener('click', this.onClick.bind(this))
  }
  draw () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.beginPath()
    this.ctx.strokeStyle = '#C3C3C3'
    this.ctx.lineWidth = 1
    for (let x = 0; x <= this.width * 8; x++) {
      this.ctx.moveTo(x * this.size, 0)
      this.ctx.lineTo(x * this.size, this.canvas.height)
    }
    for (let x = 0; x <= this.height * 8; x++) {
      this.ctx.moveTo(0, x * this.size)
      this.ctx.lineTo(this.canvas.width, x * this.size)
    }
    this.ctx.stroke()

    this.ctx.fillStyle = '#000000'
    for (let x = 0; x < this.width * 8; x++) {
      for (let y = 0; y < this.height * 8; y++) {
        if (this.game.cellAt(x, y)) {
          this.ctx.fillRect(x * 10, y * 10, 10, 10)
        }
      }
    }
  }
  onClick (event) {
    const x = ~~(event.offsetX / this.size)
    const y = ~~(event.offsetY / this.size)
    this.game.setCellAt(x, y, !this.game.cellAt(x, y))
    this.draw()
  }
}
