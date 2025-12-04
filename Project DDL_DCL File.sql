

-- Step 1: Create the Database
-- CREATE DATABASE CorporateVendorManagement;

-- Step 2: Use the Created Database
USE CorporateVendorManagement;


CREATE TABLE Vendors (
    VendorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    ContactInfo VARCHAR(255),
    ServiceCategory VARCHAR(255),
    ComplianceCertification VARCHAR(255),
    RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Contracts (
    ContractID INT AUTO_INCREMENT PRIMARY KEY,
    VendorID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Terms TEXT,
    PerformanceRating DECIMAL(3,2) DEFAULT NULL,
    FOREIGN KEY (VendorID) REFERENCES Vendors(VendorID)
);
CREATE TABLE ContractApproval (
    ApprovalID INT AUTO_INCREMENT PRIMARY KEY,
    ContractID INT NOT NULL,
    Status ENUM('Active', 'Pending', 'Rejected') NOT NULL,
    ApprovalDate DATE NOT NULL,
    Notes TEXT,
    FOREIGN KEY (ContractID) REFERENCES Contracts(ContractID)
);

CREATE TABLE PurchaseOrders (
    POID INT AUTO_INCREMENT PRIMARY KEY,
    VendorID INT NOT NULL,
    ItemDetails TEXT NOT NULL,
    Quantity INT NOT NULL,
    TotalCost DECIMAL(10,2) NOT NULL,
    Status ENUM('Pending', 'Approved', 'Fulfilled') DEFAULT 'Pending',
    FOREIGN KEY (VendorID) REFERENCES Vendors(VendorID)
);
CREATE TABLE Departments (
    DepartmentID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Budget DECIMAL(10,2) NOT NULL
);
CREATE TABLE BudgetAllocations (
    AllocationID INT AUTO_INCREMENT PRIMARY KEY,
    DepartmentID INT NOT NULL,
    VendorID INT NOT NULL,
    AmountAllocated DECIMAL(10,2) NOT NULL,
    AllocationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
    FOREIGN KEY (VendorID) REFERENCES Vendors(VendorID)
);
CREATE TABLE Expenses (
    ExpenseID INT AUTO_INCREMENT PRIMARY KEY,
    AllocationID INT NOT NULL,
    AmountSpent DECIMAL(10,2) NOT NULL,
    ExpenseDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AllocationID) REFERENCES BudgetAllocations(AllocationID)
);
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Role ENUM('Vendor', 'Procurement Manager', 'Contract Team', 'Department Head', 'Finance Team', 'Admin') NOT NULL,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    RelatedEntity ENUM('Contract', 'PurchaseOrder', 'Budget') NOT NULL,
    Message TEXT NOT NULL,
    Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE VendorPerformance (
    EvaluationID INT AUTO_INCREMENT PRIMARY KEY, -- Unique identifier for each evaluation
    VendorID INT NOT NULL, -- Foreign key linking to the vendor table
    QualityRating DECIMAL(3, 2) NOT NULL, -- Rating for quality (e.g., 0.00 to 10.00 scale)
    PricingRating DECIMAL(3, 2) NOT NULL, -- Rating for pricing
    TimelinessRating DECIMAL(3, 2) NOT NULL, -- Rating for timeliness
    PerformanceSummary TEXT, -- Summary of the performance evaluation
    EvaluationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date of the evaluation
    FOREIGN KEY (VendorID) REFERENCES Vendors(VendorID) -- Assuming Vendors table exists
);



-- Triggers



DELIMITER //
CREATE TRIGGER ContractRenewalNotification
AFTER INSERT ON Contracts
FOR EACH ROW
BEGIN
    DECLARE expiryAlertDate DATE;
    SET expiryAlertDate = DATE_SUB(NEW.EndDate, INTERVAL 30 DAY);

    -- Check if the current date matches expiryAlertDate
    IF CURDATE() = expiryAlertDate THEN
        INSERT INTO Notifications (UserID, RelatedEntity, Message, Date)
        SELECT UserID, 'Contract', 
               CONCAT('Contract with ID ', NEW.ContractID, ' is nearing expiry.') AS Message, 
               NOW()
        FROM Users 
        WHERE Role = 'Contract Team';
    END IF;
END;
//
DELIMITER ;


DELIMITER //
CREATE TRIGGER BudgetOverspendCheck
AFTER INSERT ON Expenses
FOR EACH ROW
BEGIN
    DECLARE currentSpending DECIMAL(10,2);
    DECLARE budgetLimit DECIMAL(10,2);

    -- Fetch current spending for the allocation
    SELECT SUM(AmountSpent) INTO currentSpending
    FROM Expenses
    WHERE AllocationID = NEW.AllocationID;

    -- Fetch the budget limit
    SELECT AmountAllocated INTO budgetLimit
    FROM BudgetAllocations
    WHERE AllocationID = NEW.AllocationID;

    -- Notify if overspending occurs
    IF currentSpending > budgetLimit THEN
        INSERT INTO Notifications (UserID, RelatedEntity, Message, Date)
        SELECT UserID, 'Budget', 
               CONCAT('Budget for Allocation ID ', NEW.AllocationID, ' has been exceeded.') AS Message, 
               NOW()
        FROM Users 
        WHERE Role = 'Finance Team';
    END IF;
END;
//
DELIMITER ;



-- Procedures


DELIMITER //
CREATE PROCEDURE RegisterVendor (
    IN vendorName VARCHAR(255),
    IN contactInfo VARCHAR(255),
    IN serviceCategory VARCHAR(255),
    IN complianceCert VARCHAR(255)
)
BEGIN
    INSERT INTO Vendors (Name, ContactInfo, ServiceCategory, ComplianceCertification)
    VALUES (vendorName, contactInfo, serviceCategory, complianceCert);
END //
DELIMITER ;

-- Create vendor performance report
DELIMITER //
CREATE PROCEDURE GetVendorPerformance()
BEGIN
    SELECT v.Name, v.ServiceCategory, AVG(c.PerformanceRating) AS AvgPerformance
    FROM Vendors v
    LEFT JOIN Contracts c ON v.VendorID = c.VendorID
    GROUP BY v.VendorID;
END //
DELIMITER ;

