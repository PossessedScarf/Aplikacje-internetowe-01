
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
{
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("due-date").setAttribute("min", today);
}
class Task {
    constructor(description, dueDate, id) {
        this.description = description;
        this.dueDate = dueDate;
        this.completed = false;
        this.id = id;
    }
    markCompleted() {
        this.completed = true;
    }

}

class TODO {
    constructor() {
        this.tasks = [];
        this.tasksId = 0;
    }

    newTask(description, dueDate) {
        const task = new Task(description, dueDate, this.tasksId);
        this.tasksId++;
        this.tasks.push(task);
        this.saveToLocalStorage();
    }

    removeTask(id) {
        const arrayIndex = this.tasks.findIndex(t => t.id === id);
        if (arrayIndex !== -1) {
            this.tasks.splice(arrayIndex, 1);
        }
        //draw?
        this.saveToLocalStorage();
    }

    // document.todo.tasks[3] = new Task("Schedule dentist appointment", '2024-06-15'); // Update the 4th task
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const editForm = document.getElementById("edit-form-container");
            const targetTask = document.getElementById("" + id);
            targetTask.after(editForm);
            editForm.hidden = false;
            document.getElementById("edit-text-input").placeholder = task.description;
            document.getElementById("edit-date").value = task.dueDate;

            //console.log("Desc: " + task.description + " Date: " + task.dueDate + " ID: " + task.id + " Completed: " + task.completed)

            document.getElementById('edit-form').addEventListener('submit', function (event) {
                event.preventDefault();

                const input_text = document.getElementById('edit-text-input');
                const input_date_data = document.getElementById('edit-date');

                const taskData = input_text.value.trim();
                if (!taskData) return;

                let inputDate = input_date_data.value;
                const formatted_date = inputDate.split("-").reverse().join(".");

                targetTask.querySelector('[data-role="task_name"]').textContent = taskData;
                targetTask.querySelector('[data-role="task_date"]').textContent = 'Due: ' + formatted_date;
                targetTask.classList.remove('completed');
                const checkbox = targetTask.querySelector('input[type="checkbox"]');
                if (checkbox){ checkbox.checked = false
                task.completed = false;
                }

                // sprawdzić czy zmiena
                task.description = taskData;
                task.dueDate = inputDate;

                editForm.hidden = true;
                document.getElementById("edit-text-input").value = "";
                document.getElementById("edit-date").value = "";

            }, { once: true });
            this.saveToLocalStorage();
        }
    }
    saveToLocalStorage() {
        localStorage.setItem('todoData', JSON.stringify(this));
    }

    // Static method to create a TODO instance from JSON string
    static fromJSON(jsonString) {
        const data = JSON.parse(jsonString);
        const todo = Object.create(TODO.prototype);
        todo.tasks = data.tasks.map(taskData => {
            const task = Object.create(Task.prototype);
            Object.assign(task, taskData);
            return task;
        });
        return todo;
    }

    draw() {
        const taskListDiv = document.getElementById('task_list');
        taskListDiv.innerHTML = ''; // Clear existing tasks

        this.tasks.forEach((task) => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                task.markCompleted();
                this.saveToLocalStorage();
                this.draw(); // Re-render the task list
            });

            const taskDesc = document.createElement('span');
            taskDesc.textContent = `${task.description} - Due: ${task.dueDate}`;

            taskItem.appendChild(checkbox);
            taskItem.appendChild(taskDesc);
            taskListDiv.appendChild(taskItem);
        });
    }
}


// const x = localStorage.getItem('todoData'); // Retrieve data from local storage
// if (x) {
//     document.todo = TODO.fromJSON(x); // Load TODO data from local storage if available
// }

document.todo = new TODO(); // Initialize the TODO application
// Handle form submission to add new tasks
document.getElementById('todo-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const input_text = document.getElementById('todo-input');
    const input_date_data = document.getElementById('due-date');

    const task = input_text.value.trim();
    if (!task) return;

    const list = document.getElementById('task_list');
    const template = document.getElementById('task_list_item');
    const item = template.cloneNode(true);
    item.hidden = false;

    let input_date = input_date_data.value;
    const formatted_date = input_date.split("-").reverse().join(".");

    document.todo.newTask(task, input_date); // Add task to TODO list and save to local storage

    // fill fields INSIDE THE CLONE using data-role
    item.querySelector('[data-role="task_name"]').textContent = task;
    item.querySelector('[data-role="task_date"]').textContent = 'Due: ' + formatted_date;
    item.classList.remove('completed');
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = false;
    item.id = document.todo.tasksId -1; // Set the id of the item to match the task id

    list.appendChild(item);

    input_text.value = '';
    input_date_data.value = '';

});

// Handle task completion
document.addEventListener('change', (event) => {
    if (event.target.matches('.task input[type="checkbox"]')) {
        const row = event.target.closest('.task');
        const taskId = parseInt(row.id, 10);
        const task = document.todo.tasks.find(t => t.id === taskId);
        if (task) {
            task.markCompleted();
            document.todo.saveToLocalStorage();
            row.classList.toggle('completed', event.target.checked);
        }
    }
})

// Handle task deletion
document.getElementById('task_list').addEventListener('click', (e) => {
    if (!e.target.matches('[data-role="delete"]')) return;

    const row = e.target.closest('.task');
    if (!row) return;
    const taskId = parseInt(row.id, 10);
    document.todo.removeTask(taskId);

    // remove from DOM
    row.remove();

});

// Handle task editing
document.getElementById('task_list').addEventListener('click', (e) => {
    if (!e.target.matches('[data-role="edit"]')) return;

    const row = e.target.closest('.task');
    if (!row) return;
    const taskId = parseInt(row.id, 10);
    document.todo.editTask(taskId);


});


// // fromJSON() = JSON.parse() + JSON.stringify() + Object.create()
// document.getElementById('addTaskButton').addEventListener('click', () => {
//     const taskDesc = document.getElementById('taskDescription').value;
//     const taskDueDate = document.getElementById('taskDueDate').value;
//     if (taskDesc && taskDueDate) {
//         document.todo.tasks.push(new Task(taskDesc, taskDueDate)); // Add new task
//         document.getElementById('taskDescription').value = ''; // Clear input field
//         document.getElementById('taskDueDate').value = ''; // Clear input field
//         document.todo.saveToLocalStorage(); // Save updated TODO list to local storage
//         renderTasks(); // Re-render the task list
//     }
// });
//
// function renderTasks() {
//     const taskList = document.getElementById('taskList');
//     taskList.innerHTML = ''; // Clear existing tasks
//     document.todo.tasks.forEach((task, index) => {
//         const taskItem = document.createElement('li');
//         taskItem.textContent = `${task.description} - Due: ${task.dueDate} - ${task.completed ? 'Completed' : 'Pending'}`;
//
//         const completeButton = document.createElement('button');
//         completeButton.textContent = 'Complete';
//         completeButton.disabled = task.completed;
//         completeButton.addEventListener('click', () => {
//             task.markCompleted();
//             document.todo.saveToLocalStorage(); // Save updated TODO list to local storage
//             renderTasks(); // Re-render the task list
//         });
//
//         const deleteButton = document.createElement('button');
//         deleteButton.textContent = 'Delete';
//         deleteButton.addEventListener('click', () => {
//             document.todo.tasks.splice(index, 1); // Remove task
//             document.todo.saveToLocalStorage(); // Save updated TODO list to local storage
//             renderTasks(); // Re-render the task list
//         });
//
//         taskItem.appendChild(completeButton);
//         taskItem.appendChild(deleteButton);
//         taskList.appendChild(taskItem);
//     });
// }
//
// renderTasks(); // Initial render of the task list
// document.todo.saveToLocalStorage(); // Save initial TODO list to local storage

