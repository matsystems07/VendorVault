document.addEventListener('DOMContentLoaded', () => {
    const bellIcon = document.getElementById('notification-bell');
    const dropdown = document.getElementById('notification-dropdown');
    const notificationCount = document.getElementById('notification-count');
    const notificationsList = document.getElementById('notifications-list');

    // Fetch notifications related to contracts and populate dropdown
    async function fetchNotifications() {
        try {
            const response = await fetch('/notifications-contract');
            const notifications = await response.json();

            // Update notification count
            notificationCount.textContent = notifications.length;

            // Populate notifications dropdown
            notificationsList.innerHTML = ''; // Clear previous notifications
            if (notifications.length === 0) {
                notificationsList.innerHTML = '<li>No new notifications.</li>';
            } else {
                notifications.forEach(notification => {
                    const li = document.createElement('li');
                    li.textContent = `${notification.Message} (${new Date(notification.Date).toLocaleDateString()})`;
                    notificationsList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    // Toggle dropdown visibility
    bellIcon.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Fetch notifications on page load
    fetchNotifications();
});
