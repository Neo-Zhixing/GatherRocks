import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import Lyrics from './utils/lyrics'
import * as Vibrant from 'node-vibrant'

import { shadeColor } from './utils/color'

const DEFAULT_EASING_TYPE = TWEEN.Easing.Quadratic.InOut
const DEFAULT_EASING_DURATION = 800
const LYRIC_GROUP_THRESHOLD = 10
const CAMERA_INITIAL_Z = 800
const CAMERA_VERSE_FOV = 60
const CAMERA_CHORUS_FOV = 95
const IN_NEGATIVE_THRESHOLD = -0.2

const totalChorusLayout = 1
const totalVerseLayout = 2

export default class Circles {
  container = null
  playtime = 0
  startPlaytime = null
  startPerformanceTime = null

  isLoaded = false
  lyricTexts = []
  lyricTextGroups = []
  currentLyric = null
  lookingAtLyric = null
  currentGroup = null
  currentBeat = 0

  useLrcSections = false

  analysis = null

  lrc = null

  color = {
    dark: '#871b42',
    primary: '#000000',
    vibrant: '#871b42',
  }

  useLrcSectionsConfidence = 0

  currentChorusLayout = 0
  currentVerselayout = totalChorusLayout + 1

  isLastChorus = false

  lastBeat = -1

  completedTween = true

  constructor (element) {
    this.container = element

    this.camera = new THREE.PerspectiveCamera(CAMERA_VERSE_FOV, this.container.clientWidth / this.container.clientHeight, 0.01, 2000)
    this.camera.position.set(0, 0, CAMERA_INITIAL_Z)
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xffffff)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(1.5)
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)

    this.container.appendChild(this.renderer.domElement)
    window.addEventListener('resize', this.onWindowResize.bind(this), false)

    const loader = new THREE.FontLoader()
    loader.load('/fonts/Nunito.json', font => {
      this.font = font
    })
    this.animate()
  }

  load (analysis, lyrics, time, cover) {
    this.isLoaded = false
    this.cover = cover

    if (this.cover) {
      Vibrant.from(this.cover).getPalette()
        .then(palette => {
          this.color.dark = palette.DarkMuted.getHex()
          this.color.primary = palette.DarkVibrant.getHex()
          this.color.vibrant = palette.Vibrant.getHex()
        })
    }

    if (lyrics != null) {
      const t = window.performance.now()

      if (!time) time = 0
      this.analysis = analysis
      this.lrc = new Lyrics(lyrics)
      const delay = (window.performance.now() - t) / 1000

      this.startPlaytime = time / 1000 + delay - 0.5
      this.startPerformanceTime = window.performance.now()
    } else {
      if (this.scene == null) return
    }

    if (this.scene != null) {
      new TWEEN.Tween(this.camera.fov)
        .to(CAMERA_VERSE_FOV, 800)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start()

      const circleGeometry = new THREE.CircleGeometry(300, 64)
      const circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      }))
      circle.position.set(0, 0, -600)
      circle.rotation.set(
        circle.rotation.x,
        circle.rotation.y,
        circle.rotation.z
      )
      this.scene.add(circle)

      animateVector3(circle.position, new THREE.Vector3(0, 0, CAMERA_INITIAL_Z * 1.5), {
        easing: TWEEN.Easing.Linear.None,
        duration: 1000,
      })
      tween(circle.material, 1, {
        variable: 'opacity',
        easing: TWEEN.Easing.Linear.None,
        duration: 1000,
        callback: () => {
          this.scene.background = new THREE.Color(0xffffff)
          this.scene.remove(circle)
        }
      })
    }

    if (this.scene != null || lyrics == null) {
      console.log('Resetting scene')

      this.reset()
      if (lyrics != null) {
        this.onLoaded()
      }
    }
  }
  reset () {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0])
    }
    this.lyricTexts = []
    this.lyricTextGroups = []
    this.currentLyric = null
    this.currentGroup = null
    this.lookingAtLyric = null
    this.useLrcSections = false

    this.useLrcSectionsConfidence = 0
    this.currentBeat = 0
    this.lastBeat = -1
    this.completedTween = true
    this.isLastChorus = false
  }
  onWindowResize () {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  render () {
    this.renderer.render(this.scene, this.camera)
    if (this.isLoaded) {
      this.renderLyricTexts()

      if (this.currentLyric != null && this.lookingAtLyric !== this.currentLyric) {
        this.lookingAtLyric = this.currentLyric
        const moveFrom = new THREE.Vector3().copy(this.camera.position)
        const moveTo = new THREE.Vector3(0, 0, CAMERA_INITIAL_Z)
        moveTo.x += getRandomDouble(-300, 300)
        moveTo.y += getRandomDouble(0, -120)
        moveTo.z += getRandomDouble(0, 160)

        const rotateFrom = new THREE.Quaternion().copy(this.camera.quaternion)

        const lookTo = new THREE.Vector3().copy(this.lookingAtLyric.originalPosition)

        this.camera.position.set(moveTo.x, moveTo.y, moveTo.z)
        this.camera.lookAt(lookTo)

        const rotateTo = new THREE.Quaternion().copy(this.camera.quaternion)

        this.camera.quaternion.set(rotateFrom._x, rotateFrom._y, rotateFrom._z, rotateFrom._w)
        this.camera.position.set(moveFrom.x, moveFrom.y, moveFrom.z)

        this.completedTween = false

        new TWEEN.Tween(this.camera.quaternion)
          .to(rotateTo, 1000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onComplete(() => {
            this.completedTween = true
          })
          .start()

        new TWEEN.Tween(this.camera.position)
          .to(moveTo, 1000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start()
      }
    }
  }
  animate (time) {
    requestAnimationFrame(this.animate.bind(this))
    TWEEN.update(time)

    if (this.isLoaded) {
      this.playtime = this.startPlaytime + (window.performance.now() - this.startPerformanceTime) / 1000.0
      this.checkBeat()
    }
    this.render()
  }
  checkBeat () {
    while (this.lastBeat + 1 < this.analysis.beats.length && this.playtime >= this.analysis.beats[this.lastBeat + 1].start) {
      this.lastBeat++
      this.analysis.beats[this.lastBeat].processed = true

      if (this.playtime - this.analysis.beats[this.lastBeat].start < 1) {
        this.analysis.beats[this.lastBeat].index = this.lastBeat
        this.onBeat(this.analysis.beats[this.lastBeat])
      }
    }
  }

  isChorus (group) {
    if (group == null) group = this.currentGroup
    return group != null && group.avg_loudness > this.analysis.track.loudness
  }
  onLoaded () {
    this.lrc.getLyrics().forEach(this.spawnLyric.bind(this))
    this.groupLyrics()

    if (this.font !== null) {
      this.isLoaded = true
    } else {
      setInterval(() => {
        if (this.font !== null) {
          this.isLoaded = true
        }
      }, 100)
    }
  }
  spawnPulse () {
    const chorus = this.isChorus()
    const tempoMultiplier = 100.0 / this.analysis.track.tempo * 3
    const groupMultiplier = this.currentGroup != null ? ((this.currentGroup.avg_loudness - this.analysis.track.loudness_min) / (this.analysis.track.loudness_max - this.analysis.track.loudness_min)) : 1

    const material = new THREE.MeshBasicMaterial({
      color: (this.currentBeat === 0 && this.isChorus(this.currentGroup)) ? this.color.dark : this.color.primary,
      transparent: true,
      opacity: 0,
    })

    const radius = ((this.isChorus() || this.currentBeat === 0) ? 400 : 200) * groupMultiplier
    const segments = 64

    const circleGeometry = new THREE.CircleGeometry(radius, segments)
    const circle = new THREE.Mesh(circleGeometry, material)
    if (chorus) {
      circle.position.set(0, -80, -300)
    } else {
      circle.position.set(
        this.currentBeat === 0 ? getRandomDouble(-900, 900) : getRandomDouble(-700, 700),
        this.currentBeat === 0 ? getRandomDouble(-600, 600) : getRandomDouble(-500, 500),
        getRandomDouble(-600, -300)
      )
    }
    this.scene.add(circle)

    // Move the circle
    animateVector3(
      circle.position,
      chorus
        ? new THREE.Vector3(0, 0, 1000)
        : new THREE.Vector3(
          circle.position.x + (this.currentBeat === 0 ? getRandomDouble(-450, 450) : getRandomDouble(-400, 400)),
          circle.position.y + (this.currentBeat === 0 ? getRandomDouble(-300, 300) : getRandomDouble(-250, 250)),
          1000
        )
    )

    // Display / Hide / Remove the Circle
    tween(circle.material, 0.2, {
      variable: 'opacity',
      easing: TWEEN.Easing.Linear.None,
      duration: (chorus ? 200 : 400) * tempoMultiplier,
      callback: () => {
        tween(circle.material, 0, {
          variable: 'opacity',
          easing: TWEEN.Easing.Linear.None,
          duration: (chorus ? 800 : 1600) * tempoMultiplier,
          callback: () => {
            this.scene.remove(circle)
          }
        })
      }
    })
  }
  onBeat (beat) {
    this.currentBeat = beat.index % this.analysis.track.time_signature

    this.spawnPulse()

    // Animate the background when we're in chorus
    if (this.isChorus(this.currentGroup) && this.currentBeat === 0) {
      const color = this.color.vibrant
      const darken = shadeColor(color, -0.4)
      new TWEEN.Tween(new THREE.Color(color))
        .to(new THREE.Color(darken), 200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(color => {
          this.scene.background = color
        })
        .onComplete(() => {
          new TWEEN.Tween(new THREE.Color(darken))
            .to(new THREE.Color(color), 600)
            .easing(TWEEN.Easing.Quadratic.In)
            .onUpdate(color => {
              this.scene.background = color
            })
            .start()
        })
        .start()
    }
  }
  spawnLyric (lyric) {
    const shapes = this.font.generateShapes(lyric.text, 50)

    let geometry = new THREE.ShapeGeometry(shapes)
    geometry.computeBoundingBox()

    // Init object
    const text = new THREE.Mesh(geometry, getDefaultMaterial())
    text.position.z = 0
    text.visible = false
    text.material.depthTest = false

    // Align to center
    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)
    geometry.translate(xMid, 0, 0)

    // Init properties
    text.lyric = lyric
    text.inOutAnim = 0
    text.onScreenAnim = 0
    text.geometry = geometry
    text.inThreshold = 0.5
    text.outThreshold = 1.25
    text.onScreenThresHold = 6

    if (isWhitespace(lyric.text)) {
      this.useLrcSectionsConfidence++
      if (this.useLrcSectionsConfidence >= 2) {
        // Let the .lrc does section division
        this.useLrcSections = true
      }
    }

    this.lyricTexts.push(text)
  }

  groupLyrics () {
    let group = new THREE.Group()
    for (let i = 0; i < this.lyricTexts.length; i++) {
      const it = this.lyricTexts[i]

      let isNextSection = false

      if (this.useLrcSections) { // When there're more than n empty lines in the lyrics
        if (isWhitespace(it.lyric.text)) {
          isNextSection = true // Go into next section when we encounter an empty line
        }
      } else {
        if (i > 0 && it.lyric.timestamp - this.lyricTexts[i - 1].lyric.timestamp > LYRIC_GROUP_THRESHOLD) {
          // If not the first line, and
          isNextSection = true
        }

        if (!isNextSection) {
          let lastSection = -1
          while (lastSection + 1 < this.analysis.sections.length && it.lyric.timestamp >= this.analysis.sections[lastSection + 1].start) {
            lastSection++

            if (!this.analysis.sections[lastSection].processed) {
              this.analysis.sections[lastSection].processed = true
              isNextSection = true
            }
          }
        }
      }

      if (i > 0 && isNextSection) {
        this.lyricTextGroups.push(group)
        group = new THREE.Group()
        group.layoutType = 0
      }
      group.add(it)
      it.group = group
    }
    this.lyricTextGroups.push(group)

    this.lyricTextGroups.forEach(group => {
      group.firstChildren = group.children[0]
      group.lastChildren = group.children[group.children.length - 1]
    })

    let i = 0
    this.lyricTextGroups.forEach(group => {
      let segments = 0
      while (segments < this.analysis.segments.length && this.analysis.segments[segments].start < group.firstChildren.lyric.timestamp) {
        segments++
      }

      let loudnessSum = 0
      let startSegment = segments
      while (segments < this.analysis.segments.length && this.analysis.segments[segments].start < (i + 1 === this.lyricTextGroups.length ? Number.MAX_VALUE : this.lyricTextGroups[i + 1].firstChildren.lyric.timestamp)) {
        const loudness = this.analysis.segments[segments].loudness_max
        loudnessSum += loudness
        if (!this.analysis.track.loudness_max) this.analysis.track.loudness_max = -50
        if (!this.analysis.track.loudness_min) this.analysis.track.loudness_min = 50

        if (loudness > this.analysis.track.loudness_max) this.analysis.track.loudness_max = loudness
        if (loudness < this.analysis.track.loudness_min) this.analysis.track.loudness_min = loudness
        segments++
      }

      group.avg_loudness = loudnessSum / (segments - startSegment)

      i++
    })

    this.lyricTextGroups.forEach(group => {
      while (group.firstChildren && isWhitespace(group.firstChildren.lyric.text)) {
        group.remove(group.firstChildren)
        group.firstChildren.remove()
        group.firstChildren = null

        group.firstChildren = group.children[0]
      }
    })

    this.lyricTextGroups.forEach(group => {
      if (group.children.length === 0) {
        this.lyricTextGroups = this.lyricTextGroups.filter(it => it !== group)
      }
    })

    i = 0
    this.lyricTextGroups.forEach(group => {
      console.log('Group #' + i++)
      group.children.forEach(it => console.log(it.lyric.text))
      this.buildGroupLayout(group)
    })
  }
  buildGroupLayout (group) {
    if (this.isChorus(group)) {
      group.layoutType = this.currentChorusLayout
      this.currentChorusLayout++
      if (this.currentChorusLayout === totalChorusLayout) this.currentChorusLayout = 0
    } else {
      group.layoutType = this.currentVerselayout
      this.currentVerselayout++
      if (this.currentVerselayout === totalVerseLayout + totalChorusLayout) this.currentVerselayout = totalChorusLayout
    }

    group.children.forEach(text => {
      const width = text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x
      if (width > 3500) {
        text.scale.set(text.scale.x * 0.55, text.scale.y * 0.55, text.scale.z)
      } else if (width > 3000) {
        text.scale.set(text.scale.x * 0.6, text.scale.y * 0.5, text.scale.z)
      } else if (width > 2500) {
        text.scale.set(text.scale.x * 0.65, text.scale.y * 0.65, text.scale.z)
      } else if (width > 2000) {
        text.scale.set(text.scale.x * 0.7, text.scale.y * 0.7, text.scale.z)
      } else if (width > 1500) {
        text.scale.set(text.scale.x * 0.8, text.scale.y * 0.8, text.scale.z)
      }
    })

    if (group.layoutType === 0) {
      group.children.forEach(text => {
        text.position.set(text.position.x, text.position.y, -200)
        text.onScreenAnim = 2
        text.material.color = new THREE.Color(0xffffff)
        text.material.needsUpdate = true
      })
    } else if (group.layoutType === 1) {
      let left = true
      const dry = 0.314
      const margin = 20
      let totalHeight = 0
      group.children.forEach(text => {
        text.rotation.set(text.rotation.x, text.rotation.y + left ? dry : -dry, text.rotation.z)
        const width = text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x
        const height = text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y
        totalHeight += height + margin
        text.position.set(text.position.x + (width / 1500) * 150 * (left ? 1 : -1), text.position.y, -300)
        left = !left

        text.onScreenAnim = 1
      })
    } else if (group.layoutType === 2) {
      let left = true
      const margin = 100
      let totalHeight = 0
      let j = 0
      group.children.forEach(text => {
        const width = text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x
        const height = text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y
        text.position.set(text.position.x + (width / 4 * (left ? -1 : 1)) + (left ? 75 : -75), text.position.y - totalHeight, -400)
        totalHeight += height + margin
        left = !left

        text.inThreshold = 0.5
        text.outThreshold = (j < group.children.length - 1) ? (1.25 - 2) : 1.25
        text.onScreenThresHold = 6 + 2
        text.onScreenAnim = 0
        text.inOutAnim = 1

        j++
      })
      group.totalHeight = totalHeight
    }

    this.scene.add(group)
  }

  renderLyricTexts () {
    if (this.playtime === 0) return

    for (let i = 0; i < this.lyricTexts.length; i++) {
      const it = this.lyricTexts[i]
      if (it.isKilled) continue

      // In/out
      if (!it.isSpawned && !it.isFadingIn) {
        if (it.lyric.timestamp - this.playtime < it.inThreshold && it.lyric.timestamp - this.playtime > IN_NEGATIVE_THRESHOLD) {
          it.isSpawned = true
          it.visible = true

          this.currentLyric = it
          if (this.currentGroup !== it.group) {
            this.currentGroup = it.group
            this.onGroup()
          }

          this.animateIn(it)
        }
      } else if (it.isSpawned && !it.isFadingOut) {
        if (this.lyricTexts[Math.min(i + 1, this.lyricTexts.length - 1)].lyric.timestamp - this.playtime < it.outThreshold ||
          this.playtime - it.lyric.timestamp > it.onScreenThresHold) {
          this.animateOut(it)
        }
      }

      // On screen
      if (it.isSpawned && !it.isKilled && !it.isFadingIn && !it.isFadingOut) {
        this.animateOnScreen(it)
      }
    }
    for (let i = 0; i < this.lyricTextGroups.length; i++) {
      const group = this.lyricTextGroups[i]

      if (group.lastChildren.isKilled) continue
      let anySpawn = false
      group.children.forEach(it => {
        if (it.isSpawned) {
          anySpawn = true
        }
      })
      if (!anySpawn) continue

      this.animateGroup(group)
    }
  }
  onGroup () {
    if (this.isLastChorus && this.isChorus()) return
    if (!this.isLastChorus && !this.isChorus()) return

    this.isLastChorus = this.isChorus()

    const rotateFrom = new THREE.Quaternion().copy(this.camera.quaternion)

    const lookTo = new THREE.Vector3()

    this.camera.lookAt(lookTo)

    const rotateTo = new THREE.Quaternion().copy(this.camera.quaternion)

    this.camera.quaternion.set(rotateFrom._x, rotateFrom._y, rotateFrom._z, rotateFrom._w)

    new TWEEN.Tween(this.camera.quaternion)
      .to(rotateTo, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()

    new TWEEN.Tween(this.camera.position)
      .to(moveTo, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()

    new TWEEN.Tween(this.camera.fov)
      .to(this.isChorus() ? CAMERA_CHORUS_FOV : CAMERA_VERSE_FOV, 800)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()

    const circleGeometry = new THREE.CircleGeometry(300, 64)
    const circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
      color: this.isChorus() ? this.color.dark : '#ffffff',
      transparent: true,
      opacity: 0
    }))
    circle.position.set(0, 0, -600)
    circle.rotation.set(
      circle.rotation.x,
      circle.rotation.y,
      circle.rotation.z
    )
    this.scene.add(circle)

    animateVector3(circle.position, new THREE.Vector3(0, 0, CAMERA_INITIAL_Z * 1.5), {
      easing: TWEEN.Easing.Linear.None,
      duration: 1000,
      update: d => {
        if (circle.position.z - this.camera.position.z > -10) {
          this.scene.background = new THREE.Color(this.isChorus() ? this.color.vibrant : '#ffffff')
          this.scene.remove(circle)
        }
      }
    })
    tween(circle.material, 1, {
      variable: 'opacity',
      easing: TWEEN.Easing.Linear.None,
      duration: 1000
    })
  }

  animateIn (text) { // Pure Func
    text.isFadingIn = true
    let toPos = new THREE.Vector3(text.position.x, text.position.y, text.position.z)
    let toRot = new THREE.Vector3(text.rotation.x, text.rotation.y, text.rotation.z)

    // Store original location
    text.originalPosition = new THREE.Vector3()
    text.getWorldPosition(text.originalPosition)

    if (text.inOutAnim === 0) {
      toRot = new THREE.Vector3(text.rotation.x + Math.PI / 16, text.rotation.y, text.rotation.z)
      text.position.set(text.position.x, text.position.y - 25, text.position.z)
      text.rotation.set(text.rotation.x - Math.PI / 6, text.rotation.y, text.rotation.z)
    } else if (text.inOutAnim === 1) {
      text.position.set(text.position.x - 100, text.position.y, text.position.z)
    }
    animateVector3(text.position, toPos, {
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
    })
    animateVector3(text.rotation, toRot, {
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
    })

    tween(text.material, 1, {
      variable: 'opacity',
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
      callback: () => {
        text.isFadingIn = false
      }
    })
  }

  animateOut (text) { // Not pure func
    text.isFadingOut = true
    let toPos
    let toRot
    if (text.inOutAnim === 0) {
      toPos = new THREE.Vector3(text.position.x, text.position.y + 25, text.position.z)
      toRot = new THREE.Vector3(text.rotation.x - Math.PI / 6 - Math.PI / 16, text.rotation.y, text.rotation.z)
    } else if (text.inOutAnim === 1) {
      toPos = new THREE.Vector3(text.position.x + 100, text.position.y, text.position.z)
      toRot = new THREE.Vector3(text.rotation.x, text.rotation.y, text.rotation.z)
    }
    animateVector3(text.position, toPos, {
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
    })
    animateVector3(text.rotation, toRot, {
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
    })

    tween(text.material, 0, {
      variable: 'opacity',
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
      update: () => {
        if (!text.isKilled && text.position.distanceTo(toPos) < 2) {
          text.isFadingOut = false
          text.isKilled = true
          text.visible = false
          text.position.set(0, 0, 1000)

          this.scene.remove(text)
        }
      },
    })
  }

  animateOnScreen (text) { // Pure Func
    if (text.onScreenAnim === 0) {

    } else if (text.onScreenAnim === 1) {
      text.scale.set(text.scale.x + 0.001, text.scale.y + 0.001, text.scale.z)
    } else if (text.onScreenAnim === 2) {
      text.scale.set(text.scale.x + 0.001, text.scale.y + 0.001, text.scale.z)
      text.rotation.set(text.rotation.x, text.rotation.y + 0.001, text.rotation.z)
    }
  }

  animateGroup (group) { // Pure Func
    if (group.layoutType === 0) {
    } else if (group.layoutType === 1) {
    } else if (group.layoutType === 2) {
      group.position.set(
        group.position.x,
        (this.playtime - group.firstChildren.lyric.timestamp) / (group.lastChildren.lyric.timestamp - group.firstChildren.lyric.timestamp) * group.totalHeight - 150,
        group.position.z
      )
    }
  }
}

function getDefaultMaterial () {
  return new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide
  })
}

function animateVector3 (vectorToAnimate, target, options) {
  options = options || {}
  // get targets from options or set to defaults
  const to = target || THREE.Vector3()
  const easing = options.easing || TWEEN.Easing.Quadratic.In
  const duration = options.duration || 2000
  // create the tween
  const tweenVector3 = new TWEEN.Tween(vectorToAnimate)
    .to({ x: to.x, y: to.y, z: to.z }, duration)
    .easing(easing)
    .onUpdate(function (d) {
      if (options.update) {
        options.update(d)
      }
    })
    .onComplete(function (d) {
      if (options.callback) options.callback(d)
    })
  // start the tween
  tweenVector3.start()
  // return the tween in case we want to manipulate it later on
  return tweenVector3
}

function tween (obj, target, options) {
  options = options || {}
  const easing = options.easing || TWEEN.Easing.Linear.None
  const duration = options.duration || 2000
  const variable = options.variable || 'opacity'
  const tweenTo = {}
  tweenTo[variable] = target // set the custom variable to the target
  const tween = new TWEEN.Tween(obj)
    .to(tweenTo, duration)
    .easing(easing)
    .onUpdate(function (d) {
      if (options.update) {
        options.update(d)
      }
    })
    .onComplete(function (d) {
      if (options.callback) {
        options.callback(d)
      }
    })
  tween.start()
  return tween
}

function isWhitespace (string) {
  return !string.replace(/\s/g, '').length
}

function getRandomDouble (min, max) {
  return Math.random() * (max - min) + min
}
