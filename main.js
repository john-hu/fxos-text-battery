(function() {
  // debug at air
  var MANIFEST_URL = 'app://33bfa81b-9b3b-8545-80d2-76ca07625ffc/manifest.webapp';
  // online version
  //var MANIFEST_URL = 'https://john-hu.github.io/fxos-text-battery/manifest.webapp';

  function TextBatteryLevel(addon) {
    // this part should be moved to css file, but the CSS injection feature is
    // broken now.
    this.style = document.createElement('style');
    this.style.textContent = `
      .sb-icon-battery[data-battery-level]:after {
        content: attr(data-battery-level);
        text-align: center;
        position: absolute;
        width: 2.5rem;
        height: 1.6rem;
        line-height: 1.6rem;
        color: black;
      }

      .sb-icon-battery[data-battery-level][data-charging="true"]:after {
        content: attr(data-battery-level);
        text-align: left;
        position: absolute;
        width: 2.5rem;
        height: 1.6rem;
        line-height: 1.6rem;
        color: blue;
        padding-left: 0.1rem;
      }`;
    this.inited = false;
  }

  TextBatteryLevel.prototype.init = function() {
    if (this.inited) {
      // We don't know the state of first installation. It should be 'uninited',
      // but it isn't always.
      // To prevent multiple initialization, I use this variable to pretect it.
      return;
    }

    this.battery = window.navigator.battery;
    if (!this.battery) {
      return;
    }

    document.body.appendChild(this.style);
    this.battery.addEventListener('levelchange', this);
    this.updateDataset(this.battery.level);
    this.inited = true;
  };

  TextBatteryLevel.prototype.uninit = function() {
    if (!this.battery) {
      return;
    }
    this.battery.removeEventListener('levelchange', this);
    this.updateDataset(null);
    document.body.removeChild(this.style);
    this.inited = false;
  };

  TextBatteryLevel.prototype.updateDataset = function(level) {
    var batteryIcons = document.querySelectorAll('.sb-icon-battery');
    [].forEach.call(batteryIcons, function(dom) {
      if (!level) {
        dom.removeAttribute('data-battery-level');
      } else {
        dom.dataset.batteryLevel = Math.round(level * 100);
      }
    });
  };

  TextBatteryLevel.prototype.handleEvent = function(e) {
    switch(e.type) {
      case 'levelchange':
        this.updateDataset(this.battery.level);
        break;
    }
  };

  function initTextBatteryLevel() {
    // if (document.documentElement.dataset.textBatteryLevel) {
    //   console.log('text-battery-level is already injected');
    //   return;
    // }

    var battery = new TextBatteryLevel();
    battery.init();
    navigator.mozApps.mgmt.addEventListener('enabledstatechange', (e) => {
      console.log('state change', e.application.manifestURL);
      if (e.application.manifestURL === MANIFEST_URL) {
        if (e.application.enabled) {
          battery.init();
        } else {
          battery.uninit();
        }
      }
    });

    document.documentElement.dataset.textBatteryLevel = true;
  }

  if (document.readyState !== 'loading') {
    initTextBatteryLevel();
  } else {
    document.addEventListener('readystatechange',
      function readyStateChange() {
        if (document.readyState == 'interactive') {
          document.removeEventListener('readystatechange',
            readyStateChange);
          initTextBatteryLevel();
        }
      });
  }
})();
