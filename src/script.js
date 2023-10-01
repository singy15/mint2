
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
    };
  },
  computed: {
    widthId() {
      return 10 * Math.max(...this.tasks.map(x => x.taskId.toString().length));
    }
  },
  methods: {
    keydown(e) {
      // console.log(e);
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
        } else if(e.key === "a") {
          this.ins(true);
        } else if(e.key === "n") {
          this.ins(false,false,this.tasks.length);
        } else if(e.key === "i") {
          this.ins(true, true);
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

    move(dir) {
      if(!this.selected) { return; }
      if(dir < 0 && this.selectedIndex === 0) { return; }
      if(dir > 0 && this.selectedIndex === this.tasks.length - 1) { return; }

      let i = this.selectedIndex + 1;
      while(this.tasks[i] && this.isChildrenOf(this.selected, this.tasks[i])) {
        i++;
      }

      let deleteCnt = i - 1 - this.selectedIndex + 1;

      if(dir > 0) {
        if(!(this.tasks[this.selectedIndex + deleteCnt] && this.tasks[this.selectedIndex + deleteCnt].parentId === this.selected.parentId)) {
          return;
        }
      } else if(dir < 0) {
        if(!(this.tasks[this.selectedIndex + dir].parentId === this.selected.parentId)) {
          return;
        }
      }

      let tmp = this.tasks.splice(this.selectedIndex, deleteCnt);
      this.tasks.splice(this.selectedIndex + dir, 0, ...tmp);
      this.setSelectionByIndex(this.selectedIndex + dir);
    },

    sibling(task, ls = []) {
      ls.push(task);
      if(task.parentId) {
        return this.sibling(this.tasks.filter(x => x.taskId === task.parentId)[0], ls);
      } else {
        return ls;
      }
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
        console.log(this.$refs.editorSubject[0]);
        this.$refs.editorSubject[0].focus();
        this.$refs.editorSubject[0].select();
      });
    },

    ins(setParent = false, append = false, index = null) {
      let insertionIndex = (index != null)? index : ((this.selectedIndex != null)? this.selectedIndex + 1 : 0);
      let newid = (this.tasks.length === 0)? 1 : Math.max(...this.tasks.map(x => x.taskId)) + 1;
      this.tasks.splice(insertionIndex, 0, {
        taskId: newid,
        subject: `Untitled Task ${newid}`,
        desc: ``,
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
        console.log("save");
        localStorage.setItem("/tasks", JSON.stringify(this.tasks));
        this.saveTimeout = null;
      }, 1000);
    },

    gatter(task) {
      if(this.selected == task) {
        return `>`;
      }
    }
  },
  mounted() {
    document.addEventListener("keydown", (e) => {
      this.keydown(e);
    });

    let storageContents = localStorage.getItem("/tasks");
    if(storageContents) {
      this.tasks = JSON.parse(storageContents);
    }
  }
}).mount("#app");

window.dblClick = app.dblClick;

