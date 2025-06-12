// Supabase Setup
const SUPABASE_URL = "https://rsqyajocdrjgwyrpokik.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXlham9jZHJqZ3d5cnBva2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMTYyMzcsImV4cCI6MjA2NDY5MjIzN30.DEQzG7xIbGJH3VGWaugc92CGsQQlVtaZyeZoPHiQaOk";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class Todo {
  constructor(todo, isCompleted = false, id) {
    this.todo = todo;
    this.isCompleted = isCompleted;
    this.id = id;
  }
}

class TodoModel {
  constructor() {
    this.todos = [];
  }

  async fetchTodos() {
    const { data, error } = await supabaseClient.from("todos").select("*");

    if (error) {
      console.error("Error fetching todos: ", error);
    } else {
      this.todos = data.map(
        (todo) => new Todo(todo.todo, todo.isCompleted, todo.id)
      );
    }

    return this.todos;
  }

  async addTodo(todoText) {
    const { data, error } = await supabaseClient
      .from("todos")
      .insert([{ todo: todoText, isCompleted: false }])
      .select();

    if (error) {
      console.error("Error adding todo: ", error);
    } else {
      this.todos.push(new Todo(data[0].todo, data[0].isCompleted, data[0].id));
    }
  }

  async removeTodo(id) {
    const { error } = await supabaseClient.from("todos").delete().eq("id", id);

    if (error) {
      console.error("Error deleting todo: ", error);
    } else {
      this.todos = this.todos.filter((todo) => todo.id !== id);
    }
  }

  async updateTodoText(id, newText) {
    const { error } = await supabaseClient
      .from('todos')
      .update({ todo: newText })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo text:', error);
    } else {
      const todo = this.todos.find(todo => todo.id === id);
      if (todo) todo.todo = newText;
    }
  }

  async toggleTodo(id, isCompleted) {
    const { error } = await supabaseClient
      .from('todos')
      .update({ isCompleted })
      .eq('id', id);

    if (error) {
      console.error('Error toggling todo:', error);
    } else {
      const todo = this.todos.find(todo => todo.id === id);
      if (todo) todo.isCompleted = isCompleted;
    }
  }

  async clearCompletedTodos() {
    const { error } = await supabaseClient.from('todos').delete().eq('isCompleted', true);
    if (error) {
      console.error('Error clearing completed todos:', error);
    } else {
      this.todos = this.todos.filter(todo => !todo.isCompleted);
    }
  }

  async selectAllTodo(isCompleted) {
    const { error } = await supabaseClient
      .from('todos')
      .update({ isCompleted })
      .neq('isCompleted', isCompleted);

    if (error) {
      console.error('Error selecting all todos:', error);
    } else {
      this.todos.forEach(todo => {
        todo.isCompleted = isCompleted;
      });
    }
  }

  getAllTodos() {
    return this.todos;
  }

  getAllCompletedTodo() {
    return this.todos.filter(todo => todo.isCompleted);
  }

  getallActiveTodos() {
    return this.todos.filter(todo => !todo.isCompleted);
  }
}

class TodoView {
  constructor(model) {
    this.model = model;
    this.listContainer = document.querySelector(".list-container");
    this.inputField = document.querySelector(".input-field");
    this.completedBtn = document.querySelector('.completed-btn');
    this.footerSection = document.querySelector('.footer-section');
    this.clearCompleted = document.querySelector('.clear-btn');
    this.AlltodoBtn = document.querySelector('.all-btn');
    this.ActiveBtn = document.querySelector('.active-btn');
    this.selectAllBtn = document.querySelector('.select-all-button');
    this.leftItems = document.querySelector('.left-item'); // Correct class name in your HTML

    this.bindEvents();
  }

  bindEvents() {
    this.inputField.addEventListener("keypress", async (e) => {
      const value = this.inputField.value.trim();
      if (e.key === "Enter" && value !== "") {
        await this.model.addTodo(value);
        this.inputField.value = "";
        this.render();
      }
    });

    this.listContainer.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete")) {
        const li = e.target.closest("li");
        const id = parseInt(li.dataset.id);
        await this.model.removeTodo(id);
        this.render();
      }
    });

    this.listContainer.addEventListener('dblclick', (e) => {
      const li = e.target.closest('li.list-item');
      if (!li) return;

      if (e.target.classList.contains('delete') || e.target.type === 'checkbox') return;

      const span = li.querySelector('.todo-text');
      if (!span) return;

      const currentText = span.textContent;
      const id = parseInt(li.dataset.id);

      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.classList.add('edit-input');
      span.replaceWith(input);
      input.focus();

      const saveEdit = async () => {
        const updatedText = input.value.trim();
        if (updatedText !== '') {
          await this.model.updateTodoText(id, updatedText);
          this.render();
        } else {
          this.render();
        }
      };

      input.addEventListener('blur', saveEdit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
      });
    });

    this.listContainer.addEventListener('change', async (e) => {
      if (e.target.type === 'checkbox') {
        const li = e.target.closest('li');
        const id = parseInt(li.dataset.id);
        const isCompleted = e.target.checked;

        await this.model.toggleTodo(id, isCompleted);
        this.render();
      }
    });

    this.clearCompleted.addEventListener('click', async () => {
      await this.model.clearCompletedTodos();
      this.render();
    });

    this.completedBtn.addEventListener('click', () => {
      const completedTodos = this.model.getAllCompletedTodo();
      this.render(completedTodos);
    });

    this.AlltodoBtn.addEventListener('click', () => {
      const allTodos = this.model.getAllTodos();
      this.render(allTodos);
    });

    this.ActiveBtn.addEventListener('click', () => {
      const activeTodos = this.model.getallActiveTodos();
      this.render(activeTodos);
    });

    this.selectAllBtn.addEventListener('click', async () => {
      const allCompleted = this.model.getAllTodos().every(todo => todo.isCompleted);
      await this.model.selectAllTodo(!allCompleted);
      this.render();
    });
  }

  render(todos = this.model.getAllTodos()) {
    this.listContainer.innerHTML = todos
      .map((todo) => this.createHTML(todo))
      .join("");

    this.updateFooter();
    this.updateLeftItemsCount();
  }

  updateFooter() {
    const hasTodos = this.model.getAllTodos().length > 0;
    const hasCompleted = this.model.getAllCompletedTodo().length > 0;

    if (hasTodos) {
      this.footerSection.classList.remove('hide-display');
    } else {
      this.footerSection.classList.add('hide-display');
    }

    if (hasCompleted) {
      this.clearCompleted.classList.remove('hide-display');
    } else {
      this.clearCompleted.classList.add('hide-display');
    }
  }

  updateLeftItemsCount() {
    const count = this.model.getallActiveTodos().length;
    this.leftItems.textContent = `${count} item${count !== 1 ? 's' : ''} left`;
  }

  createHTML(todo) {
    const textStyle = todo.isCompleted
      ? "text-decoration: line-through; opacity: 0.5;"
      : "";
    return `
      <li class="list-item" data-id="${todo.id}">
        <div class="section1">
          <input type="checkbox" class="todo-checkbox" ${todo.isCompleted ? "checked" : ""} />
          <span class="todo-text" style="${textStyle}">${todo.todo}</span>
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

(async () => {
  await model.fetchTodos();
  view.render();
})();
