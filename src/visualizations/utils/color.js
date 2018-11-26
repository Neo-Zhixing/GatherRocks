export function shadeColorComponent (color, percent) {
  color = parseInt(color, 16)
  color = Math.round(color * (1 + percent))
  color = (color < 255) ? color : 255
  color = color.toString(16)
  color = (color.length === 1) ? '0' + color : color
  return color
}
export function shadeColor (color, percent) {
  return '#' + [0, 1, 2]
    .map(index => color.substring(1 + index * 2, 3 + index * 2))
    .map(c => shadeColorComponent(c, percent))
    .join('')
}
