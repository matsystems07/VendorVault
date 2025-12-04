# 🎉 Corporate Vendor Management System 🎉



## 📋 Project Overview
The **Corporate Vendor Management System** is a comprehensive solution for managing vendors, contracts, budgets, expenses, and more. It streamlines operations, improves collaboration between teams, and provides insightful dashboards for decision-making.

---

## 🚀 Features

- **User Management**: Add, view, and manage all users (Admin functionality).
- **Vendor Management**: Track vendor performance and manage certifications.
- **Contract Management**: Create, review, approve, and renew contracts.
- **Finance Management**: Allocate budgets, manage expenses, and track financial reports.
- **Notifications**: Get updates for contracts, purchase orders, and budget allocations.
- **Dashboards**: Tailored dashboards for Admins, Procurement Managers, Finance Teams, and more.
- **Secure Authentication**: Role-based access for security.

---

## 🗂️ Table of Contents

- [Installation](#installation)
- [Technologies Used](#technologies-used)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [API Endpoints](#api-endpoints)
- [How to Use](#how-to-use)
- [Contributors](#contributors)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/CorporateVendorManagement.git
   ```
2. Navigate to the project directory:
   ```bash
   cd CorporateVendorManagement
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up the database:
   - Import the SQL file (`database_schema.sql`) in your MySQL server.
   - Update `server.js` with your database credentials.
5. Start the server:
   ```bash
   node server.js
   ```
6. Open the app in your browser:
   ```bash
   http://localhost:3000
   ```

---

## 🌐 Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MySQL (MySQL2 driver)
- **Styling**: Custom CSS

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Role ENUM('Vendor', 'Procurement Manager', 'Contract Team', 'Department Head', 'Finance Team', 'Admin') NOT NULL,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Vendors Table
```sql
CREATE TABLE Vendors (
    VendorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    ContactInfo VARCHAR(255),
    ServiceCategory VARCHAR(255),
    ComplianceCertification VARCHAR(255),
    RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Other tables include: `Contracts`, `PurchaseOrders`, `BudgetAllocations`, `Expenses`, `Notifications`, and `VendorPerformance`.

---

## 📸 Schema and ERD ScreenShots

1. **Relational Schema**


   ![image](https://github.com/user-attachments/assets/e8bfe327-c1aa-4aae-b9a8-750cfa55416c)


   ![image](https://github.com/user-attachments/assets/4f94b7fe-2694-46bb-b414-8629993b4b8d)

2. **ERD**
![image](https://github.com/user-attachments/assets/39b70606-2e7d-470d-9633-9fa380c9120c)



## 📸 Screenshots


1. **Admin Dashboard**

![image](https://github.com/user-attachments/assets/9dcbba90-1c05-4d8f-ac65-ff0cad4c625c)

2. **Vendor Performance Chart**

![image](https://github.com/user-attachments/assets/1399b6ef-a53f-4dc0-b90c-5924889b64d3)


3. **Finace Team Portal**

![image](https://github.com/user-attachments/assets/db6a9986-04aa-4868-8290-5f485ba3128f)

4. **Procurment Team Portal**

![image](https://github.com/user-attachments/assets/7c3d5f9e-9f6a-4527-9564-ddf2efbcf4f4)

5. **Contract Team Portal**

![image](https://github.com/user-attachments/assets/5c5f47a0-5e49-4703-a127-e67c79026294)

6. **Login Signup Pages**

![image](https://github.com/user-attachments/assets/a057937a-8ded-4b12-80f8-f5c60c06cfd5)


![image](https://github.com/user-attachments/assets/3c75d1ce-b114-49ec-b1f6-7b9ec5763f49)


   
---


## 🔗 API Endpoints

### Users
- `GET /users`: Fetch all users
- `POST /users`: Add a new user

### Vendors
- `GET /vendors`: Fetch all vendors
- `POST /vendors`: Add a new vendor

### Notifications
- `GET /notifications`: Fetch notifications for a specific user

---

## 🧑‍💻 How to Use

### Admin:
- Manage users and monitor all operations.

### Procurement Manager:
- Oversee contracts, vendors, and purchase orders.

### Finance Team:
- Allocate budgets, track expenses, and generate financial reports.

### Vendors:
- Upload certifications, manage orders, and track performance.

---

## 🤝 Contributors

- **Shahzaib Ali** - Full Stack Developer
- **Umar Iftikhar [Profile Link](https://github.com/Oye-Umar)** - Database Specialist


---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 🌟 Acknowledgments

- Special thanks to the open-source community for their amazing libraries and frameworks!
- Kudos to the team for their hard work and dedication!
