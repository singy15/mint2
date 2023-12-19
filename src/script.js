
window.onload = function() {
  Notification.requestPermission();
  setInterval(checkTime, 1000);   
};

const checkTime = function() {
  let previousMinutes;
  const options = {
    body: "mint2",
    // icon: ""
  };
  return function() {
    const currentTime = new Date();
    const minutes = currentTime.getMinutes();
    if (previousMinutes !== minutes && minutes % 15 === 0) {
      previousMinutes = minutes;
      const notification = new Notification("15 minutes passed.", options);
    }
  }  
}();

let alarmMng = new AlarmManager();
alarmMng.enable();

var app = Vue.createApp({
  data() {
    return {
      tasks: [
        // { taskId: 1, subject: "Task1", desc: "Description...", parentId: null },
        // { taskId: 2, subject: "Task2", desc: "Description...", parentId: null },
        // { taskId: 3, subject: "Task3", desc: "Description...", parentId: 2 },
        // { taskId: 4, subject: "Task4", desc: "Description...", parentId: 2 },
        // { taskId: 5, subject: "Task5", desc: "Description...", parentId: null },
      ],
      mode: "normal", // normal, edit
      selected: null,
      selectedIndex: null,
      saveTimeout: null,
      alarms: []
    };
  },
  computed: {
    widthId() {
      return 10 * Math.max(...this.tasks.map(x => x.taskId.toString().length));
    }
  },
  methods: {
    onChangeAlarms(alarms) {
      this.alarms = [];
      this.alarms = alarms;
    },
    keydown(e) {
      if(this.mode === "normal") {
        e.preventDefault();

        if((e.key === "ArrowUp" || e.key === "k") && !(e.shiftKey)) {
          this.sel(-1);
        } else if((e.key === "ArrowDown" || e.key === "j") && !(e.shiftKey)) {
          this.sel(1);
        } else if((e.key === "ArrowUp" || e.key === "K") && (e.shiftKey)) {
          this.move(-1);
        } else if((e.key === "ArrowDown" || e.key === "J") && (e.shiftKey)) {
          this.move(1);
        } else if(e.key === "e") {
          this.beginEdit();
        } else if(e.key === "d") {
          this.del();
        } else if(e.key === "*") {
          this.changeState("*");
        } else if(e.key === ">") {
          this.changeState(">");
        } else if(e.key === "?") {
          this.changeState("?");
        } else if(e.key === "-") {
          this.changeState("-");
        } else if(e.key === "x") {
          this.changeState("x");
        } else if(e.key === "a") {
          this.ins(true);
        } else if(e.key === "n") {
          this.ins(false,false,this.tasks.length);
        } else if(e.key === "i") {
          this.ins(true, true);
        } else if(e.key === "t") {
          let minutes = parseInt(prompt("minutes:"), 10);

          if(Number.isNaN(minutes)) {
            alert("invalid minutes");
            return;
          }

          let message = prompt("message:");

          if(message == null || message === undefined) {
            alert("invalid message");
            return;
          }

          let now = new Date();
          now.setMinutes(now.getMinutes() + minutes);
          alarmMng.addAlarm(message, {
            triggerTime: now.toISOString()
          });
        } else if(e.key === "p") {
          let time = prompt("alarm at:", (new Date()).toISOString());
          let date = new Date(time);

          const isInvalidDate = (date) => Number.isNaN(date.getTime());
          if(isInvalidDate(date)) {
            alert("invalid date!");
            return;
          }

          alarmMng.addAlarm(message, {
            triggerTime: date.toISOString()
          });
        }
      } else if(this.mode === "edit") {
        if(e.key === "Escape") {
          this.changeMode("normal");
        }
      }
    },

    onTaskClick(index) {
      if(this.mode === 'edit') {
        this.changeMode('normal');
      }
      this.setSelectionByIndex(index);
    },

    onTaskDblClick(index) {
      if(this.mode === 'edit') {
        this.changeMode('normal');
      }
      this.setSelectionByIndex(index);
      this.beginEdit();
    },

    changeState(state) {
      if(!this.selected) { return; }
      this.selected.state = state;
      this.onTaskModified();
    },

    move(dir) {
      if(!this.selected) { return; }
      if(dir < 0 && this.selectedIndex === 0) { return; }
      if(dir > 0 && this.selectedIndex === this.tasks.length - 1) { return; }

      let candidates = this.tasks.filter(x => x.parentId === this.selected.parentId);
      let branch = this.tasks.slice(this.selectedIndex, this.selectedIndex + this.branchCount(this.selectedIndex));
      let index = candidates.indexOf(this.selected);
      let destination = candidates[index + dir];

      if(!destination) {
        return;
      }

      let destinationIndex = this.tasks.indexOf(destination);
      let destinationBranch = this.tasks.slice(destinationIndex, destinationIndex + this.branchCount(destinationIndex));
      
      let elements = (dir > 0)? destinationBranch.concat(branch) : branch.concat(destinationBranch);

      let beginIndex = (dir > 0)? this.selectedIndex : destinationIndex;

      this.tasks.splice(beginIndex, elements.length, ...elements);

      this.setSelectionByIndex(this.tasks.indexOf(this.selected));
    },

    sibling(task, ls = []) {
      ls.push(task);
      if(task.parentId) {
        return this.sibling(this.tasks.filter(x => x.taskId === task.parentId)[0], ls);
      } else {
        return ls;
      }
    },

    branchCount(rootIndex) {
      let i = rootIndex + 1;
      let root = this.tasks[rootIndex];
      while(this.tasks[i] && this.isChildrenOf(root, this.tasks[i])) {
        i++;
      }
      return i - 1 - rootIndex + 1;
    },

    isChildrenOf(parentTask, task) {
      return this.sibling(task).some(x => x.taskId === parentTask.taskId);
    },

    sel(dir) {
      if(this.tasks.length === 0) {
        this.clearSelection();
        return;
      }

      if(null == this.selectedIndex) {
        this.selectedIndex = 0;
      } else {
        this.selectedIndex = this.selectedIndex + dir;
      }

      if(this.selectedIndex < 0) { this.selectedIndex = 0; } 
      if(this.selectedIndex >= this.tasks.length) { this.selectedIndex = this.tasks.length - 1; }

      this.selected = this.tasks[this.selectedIndex];
      
      this.$refs.item[this.selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'instant',
      });
    },

    setSelectionByIndex(index, behavior = 'instant') {
      this.selectedIndex = index;
      this.selected = this.tasks[index];
      this.$nextTick(function() {
        this.$refs.item[this.selectedIndex].scrollIntoView({
          block: 'nearest',
          behavior: behavior
        });
      });
    },

    clearSelection() {
      this.selectedIndex = null;
      this.selected = null;
    },

    del() {
      if(this.selected && this.tasks.filter(x => x.parentId === this.selected.taskId).length === 0) {
        this.tasks.splice(this.selectedIndex, 1);

        if(this.tasks[this.selectedIndex]) {
          this.setSelectionByIndex(this.selectedIndex);
        } else if(this.tasks[this.selectedIndex - 1]) {
          this.setSelectionByIndex(this.selectedIndex - 1);
        } else {
          this.clearSelection();
        }

        this.onTaskModified();
      }
    },

    beginEdit() {
      if(this.selected == null) {
        return;
      }
      this.changeMode("edit");

      this.$nextTick(function() {
        this.$refs.editorSubject[0].focus();
        this.$refs.editorSubject[0].select();
      });
    },

    ins(setParent = false, append = false, index = null) {
      let insertionIndex = (index != null)? index : ((this.selectedIndex != null)? this.selectedIndex + 1 : 0);
      if(setParent && !append && !index) {
        insertionIndex = insertionIndex + this.branchCount(this.selectedIndex) - 1;
      }
      let newid = (this.tasks.length === 0)? 1 : Math.max(...this.tasks.map(x => x.taskId)) + 1;
      this.tasks.splice(insertionIndex, 0, {
        taskId: newid,
        subject: `Untitled Task ${newid}`,
        desc: ``,
        state: "*",
        parentId: (setParent && this.selected)? ((append)? this.selected.taskId : this.selected.parentId) : null
      });
      this.setSelectionByIndex(insertionIndex, 'smooth');

      // this.beginEdit();

      this.onTaskModified();
    },

    level(task, lv = 0) {
      return (task.parentId)? this.level(this.tasks.filter(x => x.taskId === task.parentId)[0], lv+1) : lv;
    },

    isSelected(task) {
      return task == this.selected;
    },

    changeMode(mode) {
      if(this.mode === "edit" && mode === "normal") {
        this.onTaskModified();
      }

      this.mode = mode;

    },

    onTaskModified() {
      this.saveToLocalStorage();
    },

    saveToLocalStorage() {
      if(this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      
      this.saveTimeout = setTimeout(() => {
        localStorage.setItem("/tasks", JSON.stringify(this.tasks));
        this.saveTimeout = null;
      }, 1000);
    },

    gatter(task) {
      if(this.selected == task) {
        return `>>`;
      }
    },

    styleTask(task, col = "") {
      let style = {};
      if(task.state === ">") {
        style.color = "#5F5";
      } else if(task.state === "-") {
        style.color = "#AAA";
      } else if(task.state === "?") {
        style.color = "#F55";
      }

      if(col === "taskId") {
        style.width = `${this.widthId}px`;
      }

      return style;
    },
    shortDesc(task) {
      if(task.desc === "" || task.desc === "undefined") {
        return "";
      }
      
      return task.desc.split("\n").slice(0,3).join("\n");
    }
  },
  mounted() {
    document.addEventListener("keydown", (e) => {
      this.keydown(e);
    });

    let storageContents = localStorage.getItem("/tasks");
    if(storageContents) {
      let tasks = JSON.parse(storageContents);
  
      if(tasks.length > 0) {
        // ver 1 -> 2
        if(tasks[0].state === undefined) {
          tasks.map(x => x.state = "*");
        }
      }

      this.tasks = tasks;
    }

    this.alarms = alarmMng.alarms;
    alarmMng.onChange = this.onChangeAlarms;
  }
}).mount("#app");

window.dblClick = app.dblClick;

