// Viewport zoom adjustment based on orientation
(function () {
    const meta = document.getElementById('vp');
    if (!meta) return;
    function applyViewportZoom() {
        const portrait = window.matchMedia('(orientation: portrait)').matches;
        meta.setAttribute(
            'content',
            portrait
                ? 'width=device-width, initial-scale=1.08, viewport-fit=cover'
                : 'width=device-width, initial-scale=1, viewport-fit=cover'
        );
    }

    window.addEventListener('load', applyViewportZoom, { passive: true });
    window.addEventListener('orientationchange', applyViewportZoom, { passive: true });
})();
// Set minimum date for due date input to today
function setMinDate(dateField) {
    const today = new Date().toISOString().split("T")[0];

    const parentForm = dateField.closest("form");
    if (!parentForm) return;

    if (parentForm.id === "todo-form" || parentForm.id === "edit-form") {
        dateField.setAttribute("min", today);
    }
}

// normalize string for search (lowercase, remove diacritics)
// regex(/.../) selecting combining diacritical single([..]) mark in unicode(U+0300 to U+036F) globally(/g)
const stripCombining = /[\u0300-\u036f]/g;
function normalize(string) {
    return (string ?? "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(stripCombining, "");
}
// securing innerHTML inputs
// ~prompt injection~
function secureHTML(string) {
    // for every match(char) using {..} to swap
    return (string ?? "").replace(/[&<>"']/g, match =>
        ({'&':'&amp;',
            '<':'&lt;',
            '>':'&gt;',
            '"':'&quot;',
            "'":'&#39;'}[match]));
}

function indexNormalizedString(text) {
    let normalizedText = "";
    const map = [];

    // text = "Łódź" => norm = "lodz" => map  = [0,1,2,3]
    // mapping each char in norm to original text index

    for (let c = 0; c < text.length; c++) {
        const char = normalize(text[c]);

        // ligatures or special chars may normalize to multiple chars
        for (let i = 0; i < char.length; i++) {
            normalizedText += char[i];
            map.push(c);
        }
    }
    return { normalizedText, map };
}

function highlight(text, query) {
    const normalizedQuery = normalize(query).trim();
    if (!normalizedQuery) return secureHTML(text);

    const { normalizedText, map } = indexNormalizedString(text);
    const normalizedQueryLength = normalizedQuery.length;

    let output = "", lastHighlightEnd = 0, searchForNext = 0;
    while (true) {
        // indexOf(substring, fromIndex) - search for substring from given index in the string
        const index = normalizedText.indexOf(normalizedQuery, searchForNext);
        if (index === -1) break;

        const start = map[index];
        const end = map[index + normalizedQueryLength - 1] + 1;

        output += secureHTML(text.slice(lastHighlightEnd, start));
        output += `<mark>${secureHTML(text.slice(start, end))}</mark>`;

        lastHighlightEnd = end;
        searchForNext = index + normalizedQueryLength;
    }
    output += secureHTML(text.slice(lastHighlightEnd));
    return output;
}

class Task {
    constructor(description, dueDate, id) {
        this.id = id;
        this.description = description;
        this.dueDate = dueDate;
        this.completed = false;
    }
    markCompleted(state = true) {
        this.completed = Boolean(state);
    }

    static restore(obj) {
        const task = new Task(obj.description, obj.dueDate, obj.id);
        task.completed = obj.completed;
        return task;
    }
}

class TODO {
    constructor() {
        this.tasks = [];
        this.tasksId = 0;
        this.editingId = null;

        this.searchTerm = "";

        // load from localStorage
        const savedData = localStorage.getItem("todoData");
        if (savedData) {
            const restoredData = JSON.parse(savedData);
            // restore tasks to tasks array OR empty array
            this.tasks = (restoredData.tasks || []).map(Task.restore);

            // restore tasksId
            if (Number.isInteger(restoredData.tasksId)) {
                this.tasksId = restoredData.tasksId;
            } else if (this.tasks.length > 0) {
                const maxId = Math.max(...this.tasks.map(t => t.id));
                this.tasksId = maxId + 1;
            } else {
                this.tasksId = 0;
            }
        }

        // bind event listeners
        this.bindListeners();
        // initial draw/render
        this.draw();
    }

    bindListeners() {
        // -- Search form --
        const searchForm  = document.getElementById("search-form");
        const searchInput = document.getElementById("search-input");

        searchForm.addEventListener("submit", (e) => e.preventDefault());

        searchInput?.addEventListener("input", (e) => {
            this.searchTerm = e.target.value || "";
            this.draw(); // rerender on search input change
        });
        // ESC key clears search input
        searchInput?.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.currentTarget.value = "";
                this.searchTerm = "";
                this.draw();
            }
        });

        // adding tasks form submit
        const addForm = document.getElementById("todo-form");
        addForm.addEventListener("submit", (eventSubmit) => {
            eventSubmit.preventDefault();
            const desc = document.getElementById("todo-input").value.trim();
            const dateField = document.getElementById("due-date");
            const date = dateField.value;
            if (!desc) return;
            this.newTask(desc, date);
            addForm.reset();
            // reset min-date after form reset
            setMinDate(dateField);
        });

        // click delegation for edit/delete buttons
        // delegation - single listener on parent node handles all events on its children
        const list = document.getElementById("task_list");
        list.addEventListener("click", (eventClick) => {
            const delBtn = eventClick.target.closest('[data-role="delete"]');
            const editBtn = eventClick.target.closest('[data-role="edit"]');
            const taskRow = eventClick.target.closest(".task");
            if (!taskRow) return;
            const id = Number(taskRow.id);

            if (delBtn) {
                this.removeTask(id);
            } else if (editBtn) {
                this.openEdit(id, taskRow);
            }
        });

        // Checkbox „complete” delegation
        list.addEventListener("change", (eventCheckbox) => {
            if (!eventCheckbox.target.matches('input[type="checkbox"].task_checkbox')) return;
            const taskRow = eventCheckbox.target.closest(".task");
            if (!taskRow) return;
            const id = Number(taskRow.id);
            this.toggleCompleted(id, eventCheckbox.target.checked);
        });

        // Edit form submission-only handler
        const editForm = document.getElementById("edit-form");
        const editWrap = document.getElementById("edit-form-container");
        if (editForm && editWrap) {
            editForm.onsubmit = (eventSubmit) => {
                eventSubmit.preventDefault();
                if (this.editingId == null) return;
                const newDesc = document.getElementById("edit-text-input").value.trim();
                const dateField = document.getElementById("edit-date");
                const newDate = dateField.value;
                if (!newDesc) return;

                setMinDate(dateField);

                this.updateEditedTask(this.editingId, newDesc, newDate);

                // re-enable delete button of edited row
                const editedRow = document.getElementById(String(this.editingId));
                editedRow.querySelector('[data-role="delete"]').removeAttribute("disabled");
                editedRow.classList.remove("editing-active");

                this.editingId = null;
                editWrap.hidden = true;
                editForm.reset();
                setMinDate(dateField);
            };
        }
    }

    get filteredTasks() {
        const query = normalize(this.searchTerm.trim());
        if (!query) return this.tasks;

        // filter creates new array with only matching tasks
        return this.tasks.filter(task => {
            const dateText = task.dueDate ? task.dueDate.split("-").reverse().join(".") : "";
            const searchArray = normalize(`${task.description} ${dateText}`);
            return searchArray.includes(query);
        });
    }

    newTask(description, dueDate) {
        const task = new Task(description, dueDate, this.tasksId);
        this.tasksId++;
        this.tasks.push(task);
        this.saveAndRender();
    }

    removeTask(id) {
        // findIndex returns index of first matching element for given condition
        const arrayIndex = this.tasks.findIndex(task => task.id === id);
        if (arrayIndex !== -1) {
            this.tasks.splice(arrayIndex, 1);
            if(this.tasks.length === 0){
                this.tasksId = 0;
            }
            this.saveAndRender();
        }
    }

    updateEditedTask(id, description, dueDate) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;
        task.description = description;
        task.dueDate = dueDate;
        task.completed = false;
        this.saveAndRender();
    }

    toggleCompleted(id, isCompleted) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;
        task.markCompleted(isCompleted);
        this.saveAndRender();
    }

    openEdit(id, taskRow) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        const wrap = document.getElementById("edit-form-container");
        const form = document.getElementById("edit-form");
        const inputDesc = document.getElementById("edit-text-input");
        const inputDate = document.getElementById("edit-date");

        if (!wrap || !form || !inputDesc || !inputDate) {
            console.warn("Edit form elements not found.");
            return;
        }

        taskRow.after(wrap);
        wrap.hidden = false;

        inputDesc.value = task.description;
        inputDate.value = task.dueDate;

        // disable delete button for this row
        const delBtn = taskRow.querySelector('[data-role="delete"]');
        delBtn.setAttribute("disabled", "true");
        taskRow.classList.add("editing-active");

        this.editingId = id;
    }

    saveAndRender() {
        this.saveToLocalStorage();
        this.draw();
    }

    saveToLocalStorage() {
        localStorage.setItem("todoData", JSON.stringify({
            tasks: this.tasks,
            tasksId: this.tasksId
        }));
    }

    draw() {
        const list = document.getElementById("task_list");
        const taskRow = document.getElementById("task_list_item");
        if (!list || !taskRow) return;

        // move edit form out of #task_list to avoid being cleared
        const wrap = document.getElementById("edit-form-container");
        if (wrap) {
            wrap.hidden = true;               // hide while redrawing
            document.body.appendChild(wrap);  // move out of #task_list
        }

        list.innerHTML = ""; // clear existing

        // render only filtered tasks
        this.filteredTasks.forEach(task => {
            const node = taskRow.cloneNode(true);
            node.hidden = false;
            node.id = String(task.id);
            node.classList.toggle("completed", task.completed);

            const description = node.querySelector('[data-role="task_name"]');
            const dueDate = node.querySelector('[data-role="task_date"]');
            description.innerHTML = highlight(task.description, this.searchTerm);

            const formatted = task.dueDate ? task.dueDate.split("-").reverse().join(".") : "";
            dueDate.innerHTML = `Due: ${highlight(formatted, this.searchTerm)}`;

            const checkbox = node.querySelector("input.task_checkbox");
            if (checkbox) checkbox.checked = task.completed;

            list.appendChild(node);
        });

        if (wrap && this.editingId != null) {
            // querySelector uses # for ID search thus we need to escape the ID
            const editingTaskRow = list.querySelector(`#${CSS.escape(String(this.editingId))}`);
            if (editingTaskRow) {
                editingTaskRow.after(wrap);
                wrap.hidden = false;
                editingTaskRow.classList.add("editing-active");
                editingTaskRow.querySelector('[data-role="delete"]').setAttribute("disabled", "true");
            } else {
                // edited task not in filtered list, close editor
                this.editingId = null;
                wrap.hidden = true;
            }
        }
    }
}

// start
document.todo = new TODO();