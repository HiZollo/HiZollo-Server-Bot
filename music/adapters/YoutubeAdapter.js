const { exec } = require('child_process')

const YoutubeAdapter = {
  isVideoURL(url) {
    const urlRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/gi
    return urlRegex.test(url)
  },

  isPlaylistURL(url) {
    const listRegex = /^.*(list=)([^#\&\?]*).*/gi
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
      .then(data => {
        return data
          .filter(p => p.status === 'fulfilled')
          .map(p => p.value)
          .map(metadata => ({ inputURL: metadata.url, metadata }))
      })
  },

  search(query, limit = 10) {
    return this._search(query, limit)
      .then((results) => {
        return results.map(result => ({ url: result.url, title: result.title }));
      })
  },

  async _search(query, limit) {
    return new Promise((resolve, reject) => {
      exec(`yt-dlp "ytsearch${limit}:${query}" --dump-json --flat-playlist --skip-download`, (err, stdout, stderr) => {
        if (err) return reject(err)

        try {
          const results = stdout.split('\n').filter(line => line.trim()).map(line => JSON.parse(line))

          resolve(results)
        } catch (e) {
          reject(e)
        }
      })
    })
  },

  getResourceURL(url) {
    return new Promise((resolve, reject) => {
      exec(`yt-dlp -i -x --get-url --geo-bypass ${url}`, (err, stdout, stderr) => {
        if (err) return reject(err)
        resolve(stdout)
      })
    })
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
    return new Promise((resolve, reject) => {
      exec(`yt-dlp -i -x --dump-json --flat-playlist --skip-download --geo-bypass ${url}`, (err, stdout, stderr) => {
        if (err) return reject(err)
        resolve(JSON.parse(stdout))
      })
    })
  },

  _resolvePlaylistToURL(url) {
    return new Promise((resolve, reject) => {
      exec(`yt-dlp -i -x --get-url --flat-playlist --skip-download --geo-bypass "${url}"`, (err, stdout, stderr) => {
        if (err) return reject(err)
        const results = stdout.split('\n').filter(line => line.trim())
        resolve(results)
      })
    })
  }

}

module.exports = YoutubeAdapter
