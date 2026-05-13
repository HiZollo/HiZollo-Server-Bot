const { execute } = require('../../utils/execute.js')

const YoutubeAdapter = {
  isVideoURL(url) {
    const urlRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/i
    return urlRegex.test(url)
  },

  isPlaylistURL(url) {
    const listRegex = /^.*(list=)([^#\&\?]*).*/i
    return this.isVideoURL(url) && listRegex.test(url)
  },

  supports(query) {
    return this.isVideoURL(query)
  },

  isList(query) {
    return this.isPlaylistURL(query)
  },

  async getTrackInfo(url) {
    const data = await this.getMetadata(url)
    return { inputURL: data.url, metadata: data }
  },

  async getBulkTrackInfo(url) {
    const urls = await this._resolvePlaylistToURL(url)
    return Promise.allSettled(urls.map(this.getMetadata.bind(this)))
      .then(results => {
        return results
          .filter(p => p.status === 'fulfilled')
          .map(p => p.value)
          .map(metadata => ({ inputURL: metadata.url, metadata }))
      })
  },

  search(query, limit = 10) {
    return this._search(query, limit)
      .then(results => {
        return results.map(result => ({ url: result.url, title: result.title }))
      })
  },

  _search(query, limit) {
    if (isNaN(+limit)) throw Error('limit must be a number')
    return execute('yt-dlp', [
      `ytsearch${limit}:${query}`,
      '--dump-json',
      '--flat-playlist',
      '--skip-download'
    ]).then(stdout => {
      return stdout.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
    })
  },

  getResourceURL(url) {
    return execute('yt-dlp', ['-i', '-x', '--get-url', '--geo-bypass', '--', url])
      .then(stdout => stdout.trim())
  },

  getMetadata(url) {
    return this._getDumpData(url).then(this._makeMetadataFromDumpData)
  },

  _makeMetadataFromDumpData(data) {
    return {
      title: data.fulltitle,
      url: data.webpage_url,
      thumbnail: data.thumbnail,
      lengthSeconds: data.duration,
      viewCount: data.view_count,
      uploadDate: new Date(data.timestamp * 1000),
      author: {
        name: data.uploader,
        url: data.uploader_url
      }
    }
  },

  _getDumpData(url) {
    return execute('yt-dlp', [
      '-i', '-x', '--dump-json', '--flat-playlist', '--skip-download', '--geo-bypass', '--', url
    ]).then(stdout => JSON.parse(stdout))
  },

  _resolvePlaylistToURL(url) {
    return execute('yt-dlp', [
      '-i', '-x', '--get-url', '--flat-playlist', '--skip-download', '--geo-bypass', '--', url
    ]).then(stdout => stdout.split('\n').filter(line => line.trim()))
  }
};

module.exports = YoutubeAdapter
