var Service, Characteristic
var request = require('request')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-tltemperaturesensor', 'TLTemperatureSensor', TemperatureSensorAccessory)
}

function TemperatureSensorAccessory (log, config) {
  this.log = log

  this.url = config['url']
  this.method = config['method'] || 'GET'

  this.log('url: ' + this.url)
  this.log('method: ' + this.method)
}

TemperatureSensorAccessory.prototype = {
  identify: function (callback) {
    this.log('Identify requested!')
    callback() // success
  },

  httpRequest: function (url, method, callback) {
    request({
      url: url,
      method: method
    },
    (error, response, body) => {
      callback(error, response, body)
    })
  },

  getTemperature: function (callback) {
    this.log('get Temperature...')
    // 温度取得処理
    this.httpRequest(this.url, this.method, (error, response, body) => {
      let bodyJson = JSON.parse(body)
      if (error || bodyJson['error']) {
        this.log('error :' + error)
        callback(new Error('温度の取得に失敗しました'))
        return
      }
      let celsiusDegree = bodyJson['celsius_degree']
      // this.log('response :' + response)
      this.log('body :' + body)
      callback(null, celsiusDegree)
    })
  },

  getServices: function () {
    this.log('getServices')
    // サービスのキャラクタリスティック設定
    // var informationService = new Service.AccessoryInformation()
    // informationService
    //   .setCharacteristic(Characteristic.Manufacturer, 'cmd Manufacturer')
    //   .setCharacteristic(Characteristic.Model, 'cmd Model')
    //   .setCharacteristic(Characteristic.SerialNumber, 'cmd Serial Number')

    var temperatureSensorService = new Service.TemperatureSensor(this.name)

    // 現在の気温取得時の関数割り当て
    temperatureSensorService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getTemperature.bind(this))

    return [temperatureSensorService]
  }
}
