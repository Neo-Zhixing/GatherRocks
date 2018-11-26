const ID_TAGS = [
  { name: 'artist', id: 'ar' },
  { name: 'album', id: 'al' },
  { name: 'title', id: 'ti' },
  { name: 'author', id: 'au' },
  { name: 'length', id: 'length' },
  { name: 'by', id: 'by' },
  {
    name: 'offset',
    id: 'offset',
    handler: function (offset) {
      if (this) {
        this.timestampOffset = isNaN(offset) ? 0 : Number(offset) / 1000
      }
      return Number(offset)
    },
  },
  { name: 'createdBy', id: 're' },
  { name: 'createdByVersion', id: 've' },
]

for (let tag of ID_TAGS) {
  tag.re = new RegExp('\\[' + tag.id + ':(.*)\\]$', 'g')
}

export default class Lyrics {
  timestampOffset = 0
  lyrics = []
  metaInfo = {}
  constructor (lrcText) {
    if (lrcText) {
      this.load(lrcText)
    }
  }
  load (lrcText) {
    this.lyrics = []
    this.metaInfo = {}
    this.timestampOffset = 0

    const lines = String(lrcText).split('\n')
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].replace(/(^\s*)|(\s*$)/g, '')
      if (!line) {
        continue
      }

      // Parse ID Tags
      let isIdTag = false
      for (let j = 0; j < ID_TAGS.length; j++) {
        const match = ID_TAGS[j].re.exec(line)
        if (!match || match.length < 2) {
          continue
        }

        isIdTag = true
        const value = match[1].replace(/(^\s*)|(\s*$)/g, '')
        if (typeof ID_TAGS[j].handler === 'function') {
          this.metaInfo[String(ID_TAGS[j].name)] = ID_TAGS[j].handler.call(this, value)
        } else {
          this.metaInfo[String(ID_TAGS[j].name)] = String(value)
        }
      }
      if (isIdTag) {
        continue
      }

      // Parse lyric
      const timestamps = []
      while (true) {
        const match = /^(\[\d+:\d+(.\d+)?\])(.*)/g.exec(line)
        if (match) {
          timestamps.push(match[1])
          line = match[match.length - 1].replace(/(^\s*)|(\s*$)/g, '')
        } else {
          break
        }
      }
      for (let j = 0; j < timestamps.length; j++) {
        const tsMatch = /^\[(\d{1,2}):(\d|[0-5]\d)(\.(\d+))?\]$/g.exec(timestamps[j])
        if (tsMatch) {
          this.lyrics.push({
            timestamp: Number(tsMatch[1]) * 60 + Number(tsMatch[2]) + (tsMatch[4] ? Number('0.' + tsMatch[4]) : 0),
            text: line
          })
        }
      }
    }

    this.lyrics.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1)
  }
  getLyrics () {
    return this.lyrics
  }
  select (ts) {
    if (isNaN(ts) || !this.lyrics || !this.lyrics.length) {
      return -1
    }
    const timestamp = Number(ts) + this.timestampOffset
    if (timestamp < this.lyrics[0].timestamp) {
      return -1
    }
    for (let i = 0; i < (this.lyrics.length - 1); i++) {
      if (this.lyrics[i].timestamp <= timestamp &&
        this.lyrics[i + 1].timestamp > timestamp) {
        return i
      }
    }
  }
}
