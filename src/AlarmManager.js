function generateUuid() {
  let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
  for (let i = 0, len = chars.length; i < len; i++) {
    switch (chars[i]) {
      case "x":
        chars[i] = Math.floor(Math.random() * 16).toString(16);
        break;
      case "y":
        chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
        break;
    }
  }
  return chars.join("");
}

class AlarmManager {
  constructor() {
    Notification.requestPermission();
    this.alarms = JSON.parse(localStorage.getItem("/mint/alarms") ?? "[]");
    this.alarms.forEach(a => {
      if(!a.id) {
        a.id = generateUuid();
        this.saveAlarms();
      }
    });
    this.interval = null;
    this.onChange = null;
  }

  addAlarm(message, opt = {}) {
    let alarm = {
      id: generateUuid(),
      message: message,
      triggerTime: opt.triggerTime ?? null, // ISO8601
      lastTriggered: null,
    };
    this.alarms.push(alarm);
    this.saveAlarms();
    this.notifyChange();
  }

  deleteAlarm(id) {
    this.alarms = this.alarms.filter(a => !(a.id === id));
    this.saveAlarms();
    this.notifyChange();
  }

  enable() {
    if(!(null == this.interval)) { return; }

    this.interval = setInterval(() => {
      let now = new Date();
      let triggered = this.alarms.filter(a => (now >= new Date(a.triggerTime) && (!a.lastTriggered)));
      triggered.forEach(a => {
        a.lastTriggered = now.toISOString();
        let options = {
          body: "mint2",
          // icon: ""
        };
        new Notification(a.message, options);
      });
      if(triggered.length > 0) {
        //this.alarms = this.alarms.filter(a => triggered.indexOf(a) < 0);
        this.saveAlarms();
      }
    }, 1000);
  }

  disable() {
    if(null == this.interval) { return; }
    clearTimeout(this.interval);
  }

  saveAlarms() {
    localStorage.setItem("/mint/alarms", JSON.stringify(this.alarms));
  }

  notifyChange() {
    if(this.onChange) { this.onChange(this.alarms); }
  }
}
