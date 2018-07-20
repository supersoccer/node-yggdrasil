const $ = require('config')
const _ = require('lodash')
const redis = require('redis')

class Yggdrasil {
  constructor (app, port, host) {
    this.app = app

    // Set default settings
    port = port || $.redis.misty.port
    host = host || $.redis.misty.host

    this.client = redis.createClient(port, host)
    this.client.on('error', function (err) {
      console.log('Error ' + err)
    })
  }

  key (key) {
    return `${this.app}:${key}`
  }

  set (key, value, ttl) {
    if (_.isUndefined(key)) {
      throw new Error(`${$.app.name} missing 'key' in cache`)
    }

    if (_.isUndefined(value)) {
      throw new Error(`${$.app.name} missing 'value' in cache [key: ${key}]`)
    }

    key = this.key(key)
    value = JSON.stringify(value)
    ttl = ttl || 2592000

    this.client.set(key, value, 'EX', ttl)
  }

  get (key, extend) {
    extend = extend || false
    extend = extend === true ? 2592000 : extend

    return new Promise((resolve, reject) => {
      if (_.isUndefined(key)) {
        return resolve(null)
      }

      this.client.get(this.key(key), (err, reply) => {
        if (err) {
          return reject(err)
        }

        if (reply == null) {
          return resolve(reply)
        }

        reply = JSON.parse(reply)

        resolve(reply)

        if (extend) {
          this.set(key, reply, extend)
        }
      })
    })
  }

  del (key) {
    key = this.key(key)
    this.client.del(key)
    console.log(`[misty] del cache: ${key}`)
  }
}

module.exports = Yggdrasil
