const learnData = require('../helpers/learnData');
const learnRFData = require('../helpers/learnRFData');
const { ServiceManager, ServiceManagerTypes } = require('../helpers/serviceManager');
const BroadlinkRMAccessory = require('./accessory');

class LearnIRAccessory extends BroadlinkRMAccessory {

  constructor (log, config = {}, serviceManagerType) {    

    // Set a default name for the accessory
    if (!config.name) config.name = 'Learn Code';
    config.persistState = false;


    super(log, config, serviceManagerType);
  }

  toggleLearning (on, callback) {
    const { config, serviceManager } = this;
    const { disableAutomaticOff, scanRF, scanFrequency } = config;

    const turnOffCallback = () => {
      serviceManager.setCharacteristic(Characteristic.On, false);
    }

    if (scanRF || scanFrequency) {
      if (on) {
        learnRFData.start(this.host, callback, turnOffCallback, this.log, disableAutomaticOff);
      } else {
        learnRFData.stop(this.log);

        callback();
      }

      return;
    }

    if (on) {
      learnData.start(this.host, callback, turnOffCallback, this.log, disableAutomaticOff);
    } else {
      learnData.stop(this.log);

      callback();
    }
  }

  setupServiceManager () {
    const { data, name, config, serviceManagerType } = this;
    const { on, off } = data || { };

    this.serviceManager = new ServiceManagerTypes[serviceManagerType](name, Service.Switch, this.log);

    this.serviceManager.addGetCharacteristic({
      name: 'switchState',
      type: Characteristic.On,
      method: this.toggleLearning,
      bind: this
    })
  }
}

module.exports = LearnIRAccessory
