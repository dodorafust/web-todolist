// ✅ todolist.js đã nâng cấp: thêm phần ghi chú (note) cho task

function showForm(button) {
    const columnContent = button.parentElement;
    if (columnContent.querySelector('.task-form')) return;

    const form = document.createElement("div");
    form.className = "task-form";

    form.innerHTML = `
        <div class="form-row">
            <input type="text" placeholder="Task name..." class="task-input" />
            <button class="edit-icon" title="Add time & date">🖊</button>
        </div>
        <div class="datetime-fields hidden">
            <input type="date" class="task-date-input" />
            <input type="time" class="task-time-input" />
        </div>
        <textarea class="task-note-input" placeholder="Ghi chú ..."></textarea>
        <button class="add-btn">Add</button>
        <button class="cancel-btn">Cancel</button>
    `;

    form.querySelector('.edit-icon').onclick = (e) => {
        e.preventDefault();
        const fields = form.querySelector('.datetime-fields');
        fields.classList.toggle('hidden');
    };

    form.querySelector('.add-btn').onclick = () => {
        const text = form.querySelector('.task-input').value.trim();
        const date = form.querySelector('.task-date-input').value;
        const time = form.querySelector('.task-time-input').value;
        const note = form.querySelector('.task-note-input').value.trim();

        if (text) {
            const task = createTaskElement({ text, date, time, note });
            columnContent.insertBefore(task, button);
            saveTasksToLocalStorage();
        }

        form.remove();
    };

    form.querySelector('.cancel-btn').onclick = () => form.remove();
    columnContent.insertBefore(form, button);
}

function editTask(task) {
    const titleEl = task.querySelector(".task-title");
    const dateEl = task.querySelector(".task-date");
    const noteEl = task.querySelector(".task-note");

    const currentTitle = titleEl.innerText;
    let currentDate = "", currentTime = "", currentNote = noteEl ? noteEl.innerText : "";

    if (dateEl) {
        const text = dateEl.innerText;
        const dateMatch = text.match(/📅 (\d{4}-\d{2}-\d{2})/);
        const timeMatch = text.match(/🕒 (\d{2}:\d{2})/);
        if (dateMatch) currentDate = dateMatch[1];
        if (timeMatch) currentTime = timeMatch[1];
    }

    task.innerHTML = `
        <div class="form-row">
            <input type="text" value="${currentTitle}" class="edit-title-input" />
            <button class="edit-icon" title="Edit time & date">🖊</button>
        </div>
        <div class="datetime-fields hidden">
            <input type="date" class="edit-date-input" value="${currentDate}" />
            <input type="time" class="edit-time-input" value="${currentTime}" />
        </div>
        <textarea class="edit-note-input" placeholder="Ghi chú ...">${currentNote}</textarea>
        <button class="save-btn">Save</button>
        <button class="cancel-edit-btn">Cancel</button>
    `;

    task.querySelector(".edit-icon").onclick = (e) => {
        e.preventDefault();
        const fields = task.querySelector(".datetime-fields");
        fields.classList.toggle("hidden");
    };

    task.querySelector(".save-btn").onclick = () => {
        const newText = task.querySelector(".edit-title-input").value.trim();
        const newDate = task.querySelector(".edit-date-input").value;
        const newTime = task.querySelector(".edit-time-input").value;
        const newNote = task.querySelector(".edit-note-input").value.trim();

        if (newText) {
            const updatedTask = createTaskElement({ text: newText, date: newDate, time: newTime, note: newNote });
            task.replaceWith(updatedTask);
            saveTasksToLocalStorage();
        }
    };

    task.querySelector(".cancel-edit-btn").onclick = () => {
        const restored = createTaskElement({ text: currentTitle, date: currentDate, time: currentTime, note: currentNote });
        task.replaceWith(restored);
    };
}

function createTaskElement({ text, date, time, note }) {
    const task = document.createElement("div");
    task.className = "task";

    let datetimeDisplay = "";
    if (date) {
        datetimeDisplay += `📅 ${date}`;
        if (time) {
            datetimeDisplay += ` 🕒 ${time}`;
        }
    }

    task.innerHTML = `
        <div class="task-title">${text}</div>
        ${datetimeDisplay ? `<div class="task-date">${datetimeDisplay}</div>` : ""}
        ${note ? `<div class="task-note">${note}</div>` : ""}
        <div class="task-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    task.setAttribute("draggable", "true");
    task.addEventListener("dragstart", handleDragStart);
    task.addEventListener("dragend", handleDragEnd);

    task.querySelector(".edit-btn").onclick = () => editTask(task);
    task.querySelector(".delete-btn").onclick = () => {
        task.remove();
        saveTasksToLocalStorage();
    };

    return task;
}

let draggedTask = null;
function handleDragStart(e) {
    draggedTask = e.target;
    setTimeout(() => e.target.style.display = "none", 0);
}
function handleDragEnd(e) {
    setTimeout(() => {
        draggedTask.style.display = "block";
        draggedTask = null;
    }, 0);
}
function handleDragOver(e) {
    e.preventDefault();
}
function handleDrop(e) {
    e.preventDefault();
    const columnContent = e.target.closest(".column-content");
    if (draggedTask && columnContent) {
        columnContent.insertBefore(draggedTask, columnContent.querySelector(".create-task"));

        const titleEl = draggedTask.querySelector(".task-title");
        const colTitle = columnContent.closest(".column").querySelector(".column-title").innerText.trim();
        titleEl.style.textDecoration = (colTitle === "Done") ? "line-through" : "none";

        saveTasksToLocalStorage();
    }
}

function saveTasksToLocalStorage() {
    const boardData = [];
    document.querySelectorAll('.column').forEach(column => {
        const title = column.querySelector('.column-title').innerText;
        const tasks = [];
        column.querySelectorAll('.task').forEach(task => {
            const text = task.querySelector('.task-title').innerText;
            const dateEl = task.querySelector('.task-date');
            const noteEl = task.querySelector('.task-note');
            let date = "", time = "", note = noteEl ? noteEl.innerText : "";
            if (dateEl) {
                const matchDate = dateEl.innerText.match(/📅 (\d{4}-\d{2}-\d{2})/);
                const matchTime = dateEl.innerText.match(/🕒 (\d{2}:\d{2})/);
                if (matchDate) date = matchDate[1];
                if (matchTime) time = matchTime[1];
            }
            tasks.push({ text, date, time, note });
        });
        boardData.push({ title, tasks });
    });
    localStorage.setItem("kanbanTasks", JSON.stringify(boardData));
}

function loadTasksFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem("kanbanTasks"));
    if (!data) return;

    data.forEach((colData, i) => {
        const column = document.querySelectorAll('.column')[i];
        const container = column.querySelector('.column-content');

        colData.tasks.forEach(taskData => {
            const task = createTaskElement(taskData);
            container.insertBefore(task, container.querySelector(".create-task"));
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".column-content").forEach(col => {
        col.addEventListener("dragover", handleDragOver);
        col.addEventListener("drop", handleDrop);
    });
    loadTasksFromLocalStorage();
});
