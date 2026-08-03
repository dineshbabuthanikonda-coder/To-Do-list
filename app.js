// State Management & Application Logic
(function () {
  const STORAGE_KEY = 'todo_app_tasks';

  // Application State
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let currentFilter = 'all';

  // DOM Elements
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const taskCount = document.getElementById('task-count');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Initial Render
  render();

  // Event Listeners
  todoForm.addEventListener('submit', handleAddTask);
  
  // Event Delegation for Dynamic Items (Toggle, Delete, Edit)
  todoList.addEventListener('click', handleListClick);
  todoList.addEventListener('dblclick', handleListDblClick);
  todoList.addEventListener('focusout', handleListFocusOut);
  todoList.addEventListener('keydown', handleListKeyDown);

  // Filter Buttons Event Listeners
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      render();
    });
  });

  // --- CRUD Operations ---

  // CREATE
  function handleAddTask(e) {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    const newTask = {
      id: Date.now().toString(),
      text: text,
      completed: false
    };

    tasks.push(newTask);
    saveAndRender();
    todoInput.value = '';
  }

  // READ (Filtered View)
  function getFilteredTasks() {
    return tasks.filter(task => {
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      return true; // 'all'
    });
  }

  // UPDATE (Toggle / Text) & DELETE Delegation Handler
  function handleListClick(e) {
    const target = e.target;
    const item = target.closest('.todo-item');
    if (!item) return;

    const id = item.dataset.id;

    // Toggle Completion
    if (target.classList.contains('toggle-checkbox')) {
      tasks = tasks.map(t => t.id === id ? { ...t, completed: target.checked } : t);
      saveAndRender();
    }

    // Delete Task
    if (target.classList.contains('delete-btn')) {
      tasks = tasks.filter(t => t.id !== id);
      saveAndRender();
    }
  }

  // UPDATE (Enable inline editing on double click)
  function handleListDblClick(e) {
    if (e.target.classList.contains('todo-text')) {
      const item = e.target.closest('.todo-item');
      const id = item.dataset.id;
      const task = tasks.find(t => t.id === id);

      item.innerHTML = `
        <input type="text" class="edit-input" value="${escapeHtml(task.text)}" data-id="${id}">
      `;
      const editInput = item.querySelector('.edit-input');
      editInput.focus();
    }
  }

  // Save Edit on Blur
  function handleListFocusOut(e) {
    if (e.target.classList.contains('edit-input')) {
      commitEdit(e.target);
    }
  }

  // Save Edit on Enter / Cancel on Escape
  function handleListKeyDown(e) {
    if (e.target.classList.contains('edit-input')) {
      if (e.key === 'Enter') {
        commitEdit(e.target);
      } else if (e.key === 'Escape') {
        render(); // Cancel edit
      }
    }
  }

  function commitEdit(inputElement) {
    const id = inputElement.dataset.id;
    const newText = inputElement.value.trim();

    if (newText) {
      tasks = tasks.map(t => t.id === id ? { ...t, text: newText } : t);
    } else {
      // If text is empty, delete task
      tasks = tasks.filter(t => t.id !== id);
    }
    saveAndRender();
  }

  // --- LocalStorage & Rendering ---

  function saveAndRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    render();
  }

  function render() {
    const filteredTasks = getFilteredTasks();

    todoList.innerHTML = filteredTasks.map(task => `
      <li class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="todo-item-content">
          <input 
            type="checkbox" 
            class="toggle-checkbox" 
            ${task.completed ? 'checked' : ''} 
            aria-label="Toggle task completion"
          />
          <span class="todo-text">${escapeHtml(task.text)}</span>
        </div>
        <button class="delete-btn" aria-label="Delete task">Delete</button>
      </li>
    `).join('');

    // Update remaining items count
    const activeCount = tasks.filter(t => !t.completed).length;
    taskCount.textContent = `${activeCount} ${activeCount === 1 ? 'item' : 'items'} left`;
  }

  // Utility to prevent XSS attacks
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => {
      const escape = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escape[match];
    });
  }
})();