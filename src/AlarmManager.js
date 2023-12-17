class AlarmManager {
  constructor() {
    Notification.requestPermission();
    this.alarms = JSON.parse(localStorage.getItem("/mint/alarms") ?? "[]");
    this.interval = null;
  }

  addAlarm(message, opt = {}) {
    let alarm = {
      message: message,
      triggerTime: opt.triggerTime ?? null, // ISO8601
      lastTriggered: null,
    };
    this.alarms.push(alarm);
    this.saveAlarms();
  }

  enable() {
    if(!(null == this.interval)) { return; }

    this.interval = setInterval(() => {
      let now = new Date();
      let triggered = this.alarms.filter(a => now >= new Date(a.triggerTime));
      triggered.forEach(a => {
        let options = {
          body: "mint2",
          // icon: ""
        };
        new Notification(a.message, options);
      });
      if(triggered.length > 0) {
        this.alarms = this.alarms.filter(a => triggered.indexOf(a) < 0);
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
}
