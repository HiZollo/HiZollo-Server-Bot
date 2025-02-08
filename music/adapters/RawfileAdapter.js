const RawfileAdapter = {
  supports(query) {
    const urlRegex = /^https?:\/\/.*\.(mp3|wav|ogg|flac|aac|m4a|wma|alac|aiff|aif)(\?.*)?$/gi
    return urlRegex.test(query)
  },

  isList(query) {
    return false
  },

  async getTrackInfo(url) {
    return { inputURL: url, metadata: { title: url, url } }
  },

  async getBulkTrackInfo(url) {
    return [{ inputURL: url, metadata: { title: url, url } }]
  },

  getResourceURL(url) {
    return url
  }
}

module.exports = RawfileAdapter


