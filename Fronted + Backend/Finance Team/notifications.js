// Fetch and display notifications related to finance team
async function fetchNotifications() {
    try {
        const response = await fetch('/notifications-finance');
        const notifications = await response.json();

        const notificationCount = document.getElementById('notification-count');
        const notificationList = document.getElementById('notifications-list');

        if (notifications.length > 0) {
            notificationCount.textContent = notifications.length;
            notificationList.innerHTML = ''; // Clear previous notifications

            notifications.forEach(notification => {
                const listItem = document.createElement('li');
                listItem.textContent = `${notification.Date}: ${notification.Message}`;
                notificationList.appendChild(listItem);
            });
        } else {
            notificationCount.textContent = '0';
            notificationList.innerHTML = '<li>No new notifications.</li>';
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// Toggle notification dropdown visibility
document.getElementById('notification-bell').addEventListener('click', () => {
    const dropdown = document.getElementById('notification-dropdown');
    dropdown.classList.toggle('visible');
});

// Fetch notifications on page load
fetchNotifications();
