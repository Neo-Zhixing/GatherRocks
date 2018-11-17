const CacheTimeoutPrefix = '_rocks_cache_timeout_'

class Cached {
  get ttlKey () {
    return this.key + CacheTimeoutPrefix
  }
  constructor (key, storage=window.localStorage) {
    this.key = key
    this.storage = storage
  }

  set (value, timeout) {
    this.value = value
    window.localStorage.setItem(this.key, value)
    if (timeout) this.touch(timeout)
  }
  get () {
    if (this.ttl() === null) {
      this.flush()
      return null
    }
    if (this.value) return this.value
    this.value = window.localStorage.getItem(this.key)
    return this.value
  }
  touch (timeout) {
    const t = Math.round(Date.now() / 1000 + timeout)
    this._ttl = t
    window.localStorage.setItem(this.ttlKey, t)
  }
  ttl () {
    if (!this._ttl) this._ttl = window.localStorage.getItem(this.ttlKey)
    if (!this._ttl) return null
    const ttl = this._ttl - Date.now() / 1000
    if (ttl < 0) {
      this.flush()
      return null
    }
    return ttl
  }
  flush () {
    console.log('flush')
    this.value = null
    this._ttl = null
    window.localStorage.removeItem(this.key)
    window.localStorage.removeItem(this.ttlKey)
  }
}

export default Cached
