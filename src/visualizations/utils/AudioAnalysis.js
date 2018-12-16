export default class AudioAnalysis {
  /*
  bars
  beats
  meta
  sections
  segments
  tatums
  track
  */
  constructor (data) {
    for (const key in data) {
      this[key] = data[key]
    }
  }

  lastCheckTime = {
    bars: 0,
    beats: 0,
    tatums: 0,
    sections: 0,
    segments: 0,
  }
  lastCheckIndex = {
    bars: -1,
    beats: -1,
    tatums: -1,
    sections: -1,
    segments: -1,
  }
  // Key: bars, beats, tatums, sections, segments
  // Returns a time interval object
  check (key, time) {
    if (time <= this.lastCheckTime[key]) {
      // Trace back
      this.lastCheckIndex[key] = -1
    }
    this.lastCheckTime[key] = time
    while (
      this.lastCheckIndex[key] + 1 < this[key].length && // Music is still playing
      time >= this[key][this.lastCheckIndex[key] + 1].start // Next one is in the future.
      // This makes sure that we only iterate until the current beat
    ) {
      this.lastCheckIndex[key]++
      const timeDiff = time - this[key][this.lastCheckIndex[key]].start // n milliseconds since the beat
      if (timeDiff < 1) { // Less than 1 seconds since the beat
        return this[key][this.lastCheckIndex[key]] // Return the current beat
      }
    }
    return false
  }
}
