var Service, Characteristic
var request = require('request')
var schedule = require('node-schedule')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-tltemperaturesensor', 'TLTemperatureSensor', TemperatureSensorAccessory)
}

function TemperatureSensorAccessory (log, config) {
  this.log = log

  this.url = config['url'] || ''
  this.method = config['method'] || 'GET'
  this.timeout = config['timeout'] || 10000
  this.schedule = config['polling schedule'] || '*/1 * * * *'
  this.pollingJob = schedule.scheduleJob(this.schedule, function () {
    // 温度取得処理
    this.httpRequest(this.url, this.method, this.timeout, function (error, response, body) {
      let bodyJson = JSON.parse(body)
      if (error || bodyJson['error']) {
        this.log('error :' + error)
        return
      }
      let celsiusDegree = bodyJson['celsius_degree']
      // this.log('response :' + response)
      this.log('body :' + body)
      this.temperatureSensorService
        .setCharacteristic(Characteristic.CurrentTemperature, celsiusDegree)
    }.bind(this))
  }.bind(this))

  // this.dsAPI = config['deep sleep API'] || ''
  // this.dsMethod = config['deep sleep method'] || 'GET'
  // this.dsTimeout = config['deep sleep request timeout'] || this.timeout
  // this.dsSchedule = config['deep sleep schedule'] || '*/1 * * * *'
  // this.dsTime = config['deep sleep time'] || 50

  this.temperatureSensorService = new Service.TemperatureSensor(this.name)

  this.log('[TEMPERATURE SENSOR SETTINGS]')
  this.log('url                    : ' + this.url)
  this.log('method                 : ' + this.method)
  this.log('request timeout(msec)  : ' + this.timeout)
  this.log('schedule               : ' + this.schedule)
  // this.log('[DEEP SLEEP SETTINGS]')
  // this.log('url            : ' + this.dsAPI)
  // this.log('method         : ' + this.dsMethod)
  // this.log('timeout(msec)  : ' + this.dsTimeout)
  // this.log('schedule       : ' + this.dsSchedule)
  // this.log('sleepTime(sec) : ' + this.dsTime)
}

TemperatureSensorAccessory.prototype = {
  identify: function (callback) {
    this.log('Identify requested!')
    callback() // success
  },

  httpRequest: function (url, method, timeout, callback) {
    request({
      url: url,
      method: method,
      timeout: timeout
    },
    (error, response, body) => {
      callback(error, response, body)
    })
  },

  getState: function (callback) {
    this.log('get Temperature...')
    // 温度取得処理
    this.httpRequest(this.url, this.method, this.timeout, (error, response, body) => {
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
    var informationService = new Service.AccessoryInformation()
    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Things Like Manufacturer')
      .setCharacteristic(Characteristic.Model, 'Things Like Model')
      .setCharacteristic(Characteristic.SerialNumber, 'Things Like Serial Number')

    // 現在の気温取得時の関数割り当て
    this.temperatureSensorService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getState.bind(this))

    return [informationService, this.temperatureSensorService]
  }
}
