const ColorCodeKeyOrder = ['r', 'g', 'b']
const CSSRGBFuncRegex = /rgb *\( *(\d+) *, *(\d+) *, *(\d+) *\)/
export default class Color {
  r = 0
  g = 0
  b = 0
  constructor (colorStr) {
    if (arguments.length === 3) { // Initialized using three arguments
      const colors = Array.from(arguments)
      const sum = colors.reduce((a, b) => a + b)
      const divider = sum < 3 ? 1 : 0xFF
      colors.forEach((color, index) => {
        this[ColorCodeKeyOrder[index]] = color / divider
      })
    } else if (colorStr.startsWith('#') && colorStr.length === 7) { // #783F1A
      [0, 1, 2]
        .map(index => parseInt(colorStr.substring(1 + index * 2, 3 + index * 2), 16))
        .forEach((color, index) => {
          this[ColorCodeKeyOrder[index]] = color / 0xff
        })
    } else if (CSSRGBFuncRegex.test(colorStr)) {
      const info = colorStr.match(CSSRGBFuncRegex)
      info.shift() // Remove Fist
      info.forEach((color, index) => {
        this[ColorCodeKeyOrder[index]] = parseInt(color, 10) / 0xff
      })
    }
  }
  static random () {
    const colors = [0, 1, 2].map(() => Math.random())
    return new Color(...colors)
  }
  shaded (percent) {
    const colors = ColorCodeKeyOrder
      .map(key => this[key] * (1 + percent)) // turn keys into corresponding colors
      .map(color => (color < 1 ? color : 1)) // Color Max Out at 1
    return new Color(...colors)
  }
  toColorCode () {
    return '#' + ColorCodeKeyOrder
      .map(key => Math.round(this[key] * 0xFF).toString(16))
      .map(c => (c.length === 1) ? '0' + c : c)
      .join('')
  }
  toRGBFunc () {
    const colors = ColorCodeKeyOrder
      .map(key => Math.round(this[key] * 0xFF).toString())
    return `rgb(${colors.join(',')})`
  }
  copy () {
    return new Color(this.r, this.g, this.b)
  }
}
