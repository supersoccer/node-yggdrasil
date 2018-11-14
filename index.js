const { Config, Utils } = require('@supersoccer/misty-loader')
const _ = Utils.Lodash
const redis = require('redis')

const APPNAME = 'yggdrasil'
class Yggdrasil {
  constructor (app, port, host) {
    this.app = app

    // Set default settings
    port = port || Config.Yggdrasil.misty.port
    host = host || Config.Yggdrasil.misty.host

    this.client = redis.createClient(port, host)
    this.client.on('error', function (err) {
      console.log(`[${APPNAME}] Error ${err}`)
    })
  }

  key (key) {
    return `${this.app}:${key}`
  }

  set (key, value, ttl) {
    if (_.isUndefined(key)) {
      throw new Error(`[${APPNAME}] missing 'key'`)
    }

    if (_.isUndefined(value)) {
      throw new Error(`[${APPNAME}] missing 'value' [key: ${key}]`)
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
    console.log(`[${APPNAME}] delete ${key}`)
  }

  delPrefix (key) {
    key = this.key(key)
    this.client.eval("return redis.call('del', unpack(redis.call('keys', ARGV[1])))" , 0, key, function() {
      console.log(`[${APPNAME}] delete by prefix ${key}`)
    })
  }

  mgetPrefix (key) {
    key = this.key(key)
    this.client.eval("return redis.call('mget', unpack(redis.call('keys', ARGV[1])))" , 0, key, function() {
      console.log(`[${APPNAME}] mget by prefix ${key}`)
    })
  }
}

module.exports = Yggdrasil
