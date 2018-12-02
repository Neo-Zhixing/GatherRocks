export default class ConwayGame {
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
  loadPattern (pattern, initialX = 0, initialY = 0) {
    // pattern: "width@height@patternData"
    const params = pattern.split('@')
    const widthToLoad = params[0]
    const heightToLoad = params[1]
    const setValue = (index, value) => {
      const x = index % widthToLoad
      const y = ~~(index / heightToLoad)
      this.data[(x + initialX) + (y + initialY) * this.width] = value
    }
    for (let i = 0; i < widthToLoad * heightToLoad * 8; i++) {
      setValue(i, 0) // Pre-populate with 0
    }
    params[2] // patternData index:value|index2:value2|...
      .split('|') // ["index:value", "index2:value2", ...] all numbers in hex
      .map(c => c.split(':').map(a => parseInt(a, 16))) // [[index,value], [index2,value2], ...]
      .forEach(([index, value]) => setValue(index, value)) // Populate this.data
  }
  getPattern (initialX, initialY, width, height) {
    initialX = ~~(initialX / 8)
    width = ~~(width / 8)
    const pattern = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = this.data[(x + initialX) + (y + initialY) * this.width]
        if (value === 0) continue
        pattern.push(
          (y * width + x).toString(16) +
          ':' +
          value.toString(16)
        )
      }
    }
    return width + '@' + Math.ceil(height / 8) + '@' + pattern.join('|')
  }
  indexFor (x, y) {
    return y * this.width + ~~(x / 8) // ~~: Math.floor
  }
  // State Compression
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
    if (x < 0) return false
    if (x > this.width * 8 - 1) return false
    if (y < 0) return false
    if (y > this.height * 8 - 1) return false
    return true
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
      .map(([xDir, yDir]) => this.wrapCoords(x + xDir, y + yDir) ? this.cellAt(x + xDir, y + yDir, data) | 0 : 0)
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
