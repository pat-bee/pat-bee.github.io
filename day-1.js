// Redirect to the correct day's HTML file based on the current date
function navigateToDailyPage() {
    const date = new Date();
    const weekday = date.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
    window.location.href = `${weekday}.html`;
}

// Load tasks for the current day from local storage or a CSV file
function loadTasks() {
    const dayOfWeek = getDayOfWeek();
    const tasks = localStorage.getItem(dayOfWeek + 'Tasks');

    if (tasks) {
        displayTasks(JSON.parse(tasks));
    } else {
        // Load tasks from CSV file hosted on GitHub
        Papa.parse(`https://github.com/pat-bee/pat-bee.github.io/${dayOfWeek}.csv`, {
            download: true,
            header: true,
            complete: function(results) {
                localStorage.setItem(dayOfWeek + 'Tasks', JSON.stringify(results.data));
                displayTasks(results.data);
            }
        });
    }
}

// Display tasks on the webpage
function displayTasks(tasks) {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';  // Clear existing tasks

    tasks.forEach(task => {
        const checked = task.checked === 'true' ? 'checked' : '';
        const listItem = `<li><input type="checkbox" ${checked} onchange="updateTask(this, '${task.id}')">${task.description}</li>`;
        todoList.innerHTML += listItem;
    });
}

// Update task status in local storage
function updateTask(checkbox, taskId) {
    const dayOfWeek = getDayOfWeek();
    const tasks = JSON.parse(localStorage.getItem(dayOfWeek + 'Tasks'));
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].checked = checkbox.checked.toString();
    }

    localStorage.setItem(dayOfWeek + 'Tasks', JSON.stringify(tasks));
}

// Save changes to the local storage
function saveTasks() {
    const dayOfWeek = getDayOfWeek();
    const tasks = [];

    document.querySelectorAll('#todoList li input').forEach(input => {
        tasks.push({
            id: input.getAttribute('data-id'),
            description: input.parentNode.textContent,
            checked: input.checked.toString()
        });
    });

    localStorage.setItem(dayOfWeek + 'Tasks', JSON.stringify(tasks));
    alert('Tasks saved!');
}

// Helper function to get the current day of the week
function getDayOfWeek() {
    const date = new Date();
    return date.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
}

// Event listener to handle page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes(".html")) {
        loadTasks();
    }
});
