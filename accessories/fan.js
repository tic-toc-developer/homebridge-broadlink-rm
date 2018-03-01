const sendData = require('../helpers/sendData');
const BroadlinkRMAccessory = require('./accessory');
const { ServiceManagerTypes } = require('../helpers/serviceManager');

class FanAccessory extends BroadlinkRMAccessory {

  async setFanSpeed (hexData) {
    const { data, host, log, state, name, debug} = this;

    const allHexKeys = Object.keys(data || {});

    // Create an array of speeds specified in the data config
    const foundSpeeds = [];

    allHexKeys.forEach((key) => {
      const parts = key.split('fanSpeed');

      if (parts.length !== 2) return;

      foundSpeeds.push(parts[1])
    })

    if (foundSpeeds.length === 0) return log(`${name} setFanSpeed: No fan speed hex codes provided.`)

    // Find speed closest to the one requested
    const closest = foundSpeeds.reduce((prev, curr) => Math.abs(curr - state.fanSpeed) < Math.abs(prev - state.fanSpeed) ? curr : prev);
    log(`${name} setFanSpeed: (closest: ${closest})`);

    // Get the closest speed's hex data
    hexData = data[`fanSpeed${closest}`];

    sendData({ host, hexData, log, name, debug });
  }

  setupServiceManager () {
    const { config, data, name, serviceManagerType } = this;
    let { showSwingMode, showRotationDirection } = config;
    const { on, off, clockwise, counterClockwise, swingToggle } = data || {};

    // Defaults
    if (showSwingMode !== false) showSwingMode = true
    if (showRotationDirection !== false) showRotationDirection = true

    this.serviceManager = new ServiceManagerTypes[serviceManagerType](name, Service.Fanv2, this.log);

    this.serviceManager.addToggleCharacteristic({
      name: 'switchState',
      type: Characteristic.On,
      getMethod: this.getCharacteristicValue,
      setMethod: this.setCharacteristicValue,
      bind: this,
      props: {
        onData: on,
        offData: off,
      }
    });

    if (showSwingMode) {
      this.serviceManager.addToggleCharacteristic({
        name: 'swingMode',
        type: Characteristic.SwingMode,
        getMethod: this.getCharacteristicValue,
        setMethod: this.setCharacteristicValue,
        bind: this,
        props: {
          onData: swingToggle,
          offData: swingToggle,
        }
      });
    }

    this.serviceManager.addToggleCharacteristic({
      name: 'fanSpeed',
      type: Characteristic.RotationSpeed,
      getMethod: this.getCharacteristicValue,
      setMethod: this.setCharacteristicValue,
      bind: this,
      props: {
        setValuePromise: this.setFanSpeed.bind(this)
      }
    });

    if (showRotationDirection) {
      this.serviceManager.addToggleCharacteristic({
        name: 'rotationDirection',
        type: Characteristic.RotationDirection,
        getMethod: this.getCharacteristicValue,
        setMethod: this.setCharacteristicValue,
        bind: this,
        props: {
          onData: clockwise,
          offData: counterClockwise
        }
      });
    }
  }
}

module.exports = FanAccessory;
