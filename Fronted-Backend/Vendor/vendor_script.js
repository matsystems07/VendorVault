        const bell = document.getElementById('notification-bell');
        const dropdown = document.getElementById('notification-dropdown');
        const notificationCount = document.getElementById('notification-count');
        const notificationsList = document.getElementById('notifications-list');

        // Notification data
        let notifications = [
            "New contract uploaded: Contract #3",
            "Purchase order #104 has been approved",
            "Performance evaluation updated: 4.8/5",
        ];

        // Update notifications count
        notificationCount.textContent = notifications.length;

        // Add event listener to the bell icon
        bell.addEventListener('click', () => {
            // Toggle dropdown visibility
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none'; // Close dropdown if open
            } else {
                dropdown.style.display = 'block'; // Open dropdown if closed

                // Populate notifications if dropdown is opened
                notificationsList.innerHTML = ''; // Clear existing list
                notifications.forEach((notification, index) => {
                    const li = document.createElement('li');
                    li.textContent = notification;
                    li.addEventListener('click', () => {
                        alert(`Notification #${index + 1}: ${notification}`);
                    });
                    notificationsList.appendChild(li);
                });
            }
        });

        // Close dropdown if clicked outside (optional)
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
