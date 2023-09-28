
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
    };
  },
  methods: {
    keydown(e) {
      console.log(e);
      if(this.mode === "normal") {
        e.preventDefault();

        if(e.key === "ArrowUp") {
          this.sel(-1);
        } else if(e.key === "ArrowDown") {
          this.sel(1);
        } else if(e.key === "e") {
          this.changeMode("edit");
        } else if(e.key === "d") {
          this.del();
        } else if(e.key === "i") {
          this.ins(true);
        } else if(e.key === "a") {
          this.ins(true, true);
        }
      } else if(this.mode === "edit") {
        if(e.key === "Escape") {
          this.changeMode("normal");
        }
      }
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

        if(this.tasks[this.selectedIndex - 1]) {
          this.setSelectionByIndex(this.selectedIndex - 1);
        } else {
          this.clearSelection();
        }
      }
    },

    ins(setParent = false, append = false) {
      let insertionIndex = (this.selectedIndex != null)? this.selectedIndex + 1 : 0;
      let newid = (this.tasks.length === 0)? 1 : Math.max(...this.tasks.map(x => x.taskId)) + 1;
      this.tasks.splice(insertionIndex, 0, {
        taskId: newid,
        subject: `Untitled Task ${newid}`,
        desc: ``,
        parentId: (setParent && this.selected)? ((append)? this.selected.taskId : this.selected.parentId) : null
      });
      this.setSelectionByIndex(insertionIndex, 'smooth');
    },

    level(task, lv = 0) {
      return (task.parentId)? this.level(this.tasks.filter(x => x.taskId === task.parentId)[0], lv+1) : lv;
    },

    isSelected(task) {
      return task == this.selected;
    },

    changeMode(mode) {
      if(mode === "edit" && this.selected == null) {
        return;
      }

      this.mode = mode;

      if(mode === "edit") {
        this.$nextTick(function() {
          console.log(this.$refs.editorSubject[0]);
          this.$refs.editorSubject[0].focus();
        });
      }
    }
  },
  mounted() {
    document.addEventListener("keydown", (e) => {
      this.keydown(e);
    });
  }
}).mount("#app");

window.dblClick = app.dblClick;

