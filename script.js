(() => {
  const STORAGE_KEY = "daymark-tasks-v1";
  const form = document.querySelector("#add-form");
  const input = document.querySelector("#task-input");
  const list = document.querySelector("#task-list");
  const emptyState = document.querySelector("#empty-state");
  const emptyTitle = document.querySelector("#empty-title");
  const emptyCopy = document.querySelector("#empty-copy");
  const taskCount = document.querySelector("#task-count");
  const progressLabel = document.querySelector("#progress-label");
  const clearCompleted = document.querySelector("#clear-completed");
  const filters = document.querySelector(".filters");
  let activeFilter = "all";
  let tasks = loadTasks();

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter((task) => task && typeof task.id === "string" && typeof task.text === "string" && typeof task.completed === "boolean");
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      taskCount.textContent = "Storage unavailable";
    }
  }

  function render() {
    const visibleTasks = tasks.filter((task) => {
      if (activeFilter === "active") return !task.completed;
      if (activeFilter === "completed") return task.completed;
      return true;
    });
    const remaining = tasks.filter((task) => !task.completed).length;
    const completed = tasks.length - remaining;
    const fragment = document.createDocumentFragment();

    for (const task of visibleTasks) {
      const row = document.createElement("li");
      row.className = `task-row${task.completed ? " is-complete" : ""}`;
      row.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.className = "task-check";
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.text}`);

      const text = document.createElement("span");
      text.className = "task-text";
      text.textContent = task.text;

      const remove = document.createElement("button");
      remove.className = "delete-button";
      remove.type = "button";
      remove.dataset.action = "delete";
      remove.textContent = "Delete";
      remove.setAttribute("aria-label", `Delete: ${task.text}`);

      row.append(checkbox, text, remove);
      fragment.append(row);
    }

    list.replaceChildren(fragment);
    list.hidden = visibleTasks.length === 0;
    emptyState.hidden = visibleTasks.length !== 0;
    if (tasks.length === 0) {
      emptyTitle.textContent = "A clear start.";
      emptyCopy.textContent = "Add a task and take it one step at a time.";
    } else if (visibleTasks.length === 0) {
      emptyTitle.textContent = activeFilter === "active" ? "Nothing left to do." : "No completed tasks yet.";
      emptyCopy.textContent = activeFilter === "active" ? "You have made it through the list." : "Finished tasks will show up here.";
    }

    taskCount.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
    progressLabel.textContent = tasks.length === 0 ? "Ready when you are" : `${remaining} left · ${completed} done`;
    clearCompleted.disabled = completed === 0;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    tasks.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, completed: false });
    saveTasks();
    activeFilter = "all";
    filters.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === activeFilter));
    });
    render();
    input.value = "";
    input.focus();
  });

  list.addEventListener("change", (event) => {
    if (!event.target.matches(".task-check")) return;
    const row = event.target.closest(".task-row");
    const task = tasks.find((item) => item.id === row.dataset.id);
    if (!task) return;
    task.completed = event.target.checked;
    saveTasks();
    render();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="delete"]');
    if (!button) return;
    const row = button.closest(".task-row");
    tasks = tasks.filter((task) => task.id !== row.dataset.id);
    saveTasks();
    render();
  });

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    filters.querySelectorAll("[data-filter]").forEach((filterButton) => {
      filterButton.setAttribute("aria-pressed", String(filterButton === button));
    });
    render();
  });

  clearCompleted.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    render();
  });

  document.querySelector("#date-label").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long", month: "long", day: "numeric"
  }).format(new Date());

  render();
})();
