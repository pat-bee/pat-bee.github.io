document.addEventListener('DOMContentLoaded', function() {
    const dayOfWeek = getDayOfWeek();
    loadTasks(dayOfWeek);

    document.getElementById('saveButton').addEventListener('click', () => {
        saveTasks(dayOfWeek);
    });
});

function getDayOfWeek() {
    const date = new Date();
    return date.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
}

function loadTasks(day) {
    const csvData = localStorage.getItem(day);
    if (csvData) {
        const tasks = Papa.parse(csvData, { header: true }).data;
        displayTasks(tasks);
    } else {
        // Load default tasks from a CSV file on GitHub
        Papa.parse(`https://pat-bee.github.io/master.csv/${day}.csv`, {
            download: true,
            header: true,
            complete: function(results) {
                displayTasks(results.data);
            }
        });
    }
}

function displayTasks(tasks) {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = ''; // Clear existing tasks

    tasks.forEach(task => {
        const checked = task.checked === 'true' ? 'checked' : '';
        const listItem = `<li><input type="checkbox" ${checked} onchange="updateTask(this, '${task.id}')">${task.description}</li>`;
        todoList.innerHTML += listItem;
    });
}

function updateTask(checkbox, taskId) {
    const tasks = JSON.parse(localStorage.getItem(getDayOfWeek())) || [];
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.checked = checkbox.checked.toString();
    }
    localStorage.setItem(getDayOfWeek(), JSON.stringify(tasks));
}

function saveTasks(day) {
    const tasks = [];
    document.querySelectorAll('#todoList li input').forEach(input => {
        tasks.push({ id: input.getAttribute('data-id'), description: input.parentNode.textContent, checked: input.checked.toString() });
    });
    localStorage.setItem(day, JSON.stringify(tasks));
    alert('Tasks saved!');
}
