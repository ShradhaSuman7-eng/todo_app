class Todo {
  constructor(todo, isCompleted = false, id = Date.now()) {
    this.todo = todo;
    this.isCompleted = isCompleted;
    this.id = id;
  }

  toggle() {
    this.isCompleted = !this.isCompleted;
  }
}

class TodoModel {
  constructor() {
    const saved = this.getFromLocalStorage();
    this.todos = saved || [];
  }

  addTodo(todoText) {
    this.todos.push(new Todo(todoText));
    this.saveToLocalStorage();
  }

  removeTodo(id) {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.saveToLocalStorage();
  }

  getAllTodos() {
    return this.todos;
  }

  getAllActiveTodo() {
    return this.todos.filter((todo) => !todo.isCompleted);
  }

  getAllCompletedTodo() {
    return this.todos.filter((todo) => todo.isCompleted);
  }

  selectAllTodo(isCompleted) {
    this.todos.forEach((todo) => {
      todo.isCompleted = isCompleted;
    });
    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    localStorage.setItem("tasks", JSON.stringify(this.todos));
  }

  getFromLocalStorage() {
    const tasks = JSON.parse(localStorage.getItem("tasks"));
    if (!tasks) return [];
    return tasks.map((task) => new Todo(task.todo, task.isCompleted, task.id));
  }
}

class TodoView {
  constructor(model) {
    this.model = model;
    this.listContainer = document.querySelector(".list-container");
    this.inputField = document.querySelector(".input-field");
    this.allTodoBtn = document.querySelector(".all-btn");
    this.allActiveBtn = document.querySelector(".active-btn");
    this.completedBtn = document.querySelector(".completed-btn");
    this.leftItemCount = document.querySelector(".left-item");
    this.clearCompleted = document.querySelector(".clear-btn");
    this.footerSection = document.querySelector(".footer-section");
    this.section1 = document.querySelector(".section1");
    this.selectAllButton = document.querySelector(".select-all-button");
    this.allBtn = document.querySelectorAll(".btn");

    this.bindEvents();
  }

  bindEvents() {
    // Add new todo
    this.inputField.addEventListener("keypress", (e) => {
      const value = this.inputField.value.trim();
      if (e.key === "Enter" && value !== "") {
        this.model.addTodo(value);
        this.inputField.value = "";
        this.render();
      }
    });

    // Delete todo
    this.listContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete")) {
        const id = parseInt(e.target.closest("li").dataset.id);
        this.model.removeTodo(id);
        this.render();
      }
    });

    // Filter: All
    this.allTodoBtn.addEventListener("click", () => {
      const todos = this.model.getAllTodos();
      this.render(todos);
      this.middleSectionUpdaton(0); // Index for 'All'
    });

    // Filter: Active
    this.allActiveBtn.addEventListener("click", () => {
      const todos = this.model.getAllActiveTodo();
      this.render(todos);
      this.middleSectionUpdaton(1); // Index for 'Active'
    });

    // Filter: Completed
    this.completedBtn.addEventListener("click", () => {
      const todos = this.model.getAllCompletedTodo();
      this.render(todos);
      this.middleSectionUpdaton(2); // Index for 'Completed'
    });

    // Toggle complete
    this.listContainer.addEventListener("change", (e) => {
      if (e.target.type === "checkbox") {
        const li = e.target.closest("li");
        const id = parseInt(li.dataset.id);
        const todo = this.model.todos.find((todo) => todo.id === id);
        if (todo) {
          todo.toggle();
          this.model.saveToLocalStorage();
          this.render(this.model.getAllTodos());
        }
      }
    });

    // Clear completed
    this.clearCompleted.addEventListener("click", this.clearCompletedTasks);

    this.listContainer.addEventListener("dblclick", (e) => {
      const li = e.target.closest("li.list-item");
      if (!li) return;

      // Exclude clicks on delete button or checkbox
      if (
        e.target.classList.contains("delete") ||
        e.target.type === "checkbox"
      ) {
        return;
      }

      const span = li.querySelector(".todo-text");
      if (!span) return;

      const currentText = span.textContent;
      const id = parseInt(li.dataset.id);

      const input = document.createElement("input");
      input.type = "text";
      input.value = currentText;
      input.classList.add("edit-input");
      span.replaceWith(input);
      input.focus();

      const saveEdit = () => {
        const updatedText = input.value.trim();
        if (updatedText !== "") {
          const todo = this.model.todos.find((todo) => todo.id === id);
          if (todo) {
            todo.todo = updatedText;
            this.model.saveToLocalStorage();
            this.render();
          }
        } else {
          this.render();
        }
      };

      input.addEventListener("blur", saveEdit);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
      });
    });

    this.selectAllButton.addEventListener("click", () => {
      const allCompleted = this.model
        .getAllTodos()
        .every((todo) => todo.isCompleted);
      this.model.selectAllTodo(!allCompleted); // toggle
      this.render();
    });
  }

  updateItemsLeft() {
    const activeCount = this.model.getAllActiveTodo().length;
    this.leftItemCount.textContent = `${activeCount} item${
      activeCount !== 1 ? "s" : ""
    } left`;
  }

  updateClearCompletedButton() {
    const hasTodos = this.model.getAllTodos().length > 0;
    const hasCompleted = this.model.getAllCompletedTodo().length > 0;

    if (hasTodos) {
      this.footerSection.classList.remove("hide-display");
    } else {
      this.footerSection.classList.add("hide-display");
    }

    if (hasCompleted) {
      this.clearCompleted.classList.remove("hide-display");
    } else {
      this.clearCompleted.classList.add("hide-display");
    }
  }

  clearCompletedTasks = () => {
    this.model.todos = this.model.getAllActiveTodo(); // Remove completed todos
    this.model.saveToLocalStorage();
    this.render();
  };

  middleSectionUpdaton(index) {
    this.allBtn.forEach((btn, i) => {
      if (i === index) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  render(todos = this.model.getAllTodos()) {
    this.listContainer.innerHTML = todos
      .map((todo) => this.createHTML(todo))
      .join("");
    this.updateItemsLeft();
    this.updateClearCompletedButton();
  }

  createHTML(todo) {
    const textStyle = todo.isCompleted
      ? "text-decoration: line-through; opacity: 0.5;"
      : "";
    return `
      <li class="list-item" data-id="${todo.id}">
        <div class="section1">
          <input type="checkbox" class="todo-checkbox" ${
            todo.isCompleted ? "checked" : ""
          } />
          <span id="text-content" class="todo-text" style="${textStyle}">${
      todo.todo
    }</span>
        </div>
        <div class="section2">
          <button class="delete">X</button>
        </div>
      </li>
    `;
  }
}

const model = new TodoModel();
const view = new TodoView(model);
view.render();
