export function getRandomDouble (min, max) {
  return Math.random() * (max - min) + min
}

export function getRandomPoint (width, height) {
  return {
    x: width * Math.random(),
    y: height * Math.random()
  }
}
