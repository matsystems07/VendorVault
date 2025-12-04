const express = require('express');
// const mysql = require('mysql2');
const multer = require('multer');

const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt'); // For password hashing
const cors = require('cors');
const fs = require('fs');



const app = express();
const port = 3000;

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
const mysql = require('mysql2');

// Serve static files from specific folders
app.use('/Vendor', express.static(path.join(__dirname, '../Vendor')));
app.use('/Procurement_Manager', express.static(path.join(__dirname, '../Procurement Manager')));
app.use('/Contract_Team', express.static(path.join(__dirname, '../Contract Team')));
app.use('/Finance_Team', express.static(path.join(__dirname, '../Finance Team')));
app.use('/Department_Head', express.static(path.join(__dirname, '../Department_Head')));
app.use('/Admin', express.static(path.join(__dirname, '../Admin')));
app.use('/Login_Signup_Pages', express.static(path.join(__dirname, '../Login_Signup_Pages')));

// Create MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'CorporateVendorManagement',
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    process.exit(1); // Stop the server if DB connection fails
  }
  console.log('Connected to the MySQL database.');
});

// Serve the Login Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Login_Signup_Pages/login.html'));
});

// Serve the vendor signup page
app.get('/register-vendor.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../Login_Signup_Pages/register-vendor.html'));
});

// Vendor signup route
app.post('/vendor-signup', async (req, res) => {
  const { name, email, password, serviceCategory, compliance } = req.body;

  // Validate inputs
  if (!name || !email || !password || !serviceCategory || !compliance) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // Check if the email already exists in the Users table
    const [existingUser] = await db.promise().query('SELECT * FROM Users WHERE Username = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Begin transaction
    await db.promise().beginTransaction();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into Users table
    const [userResult] = await db.promise().query(
      'INSERT INTO Users (Username, Password, Role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'Vendor']
    );

    // Insert into Vendors table
    await db.promise().query(
      'INSERT INTO Vendors (Name, ContactInfo, ServiceCategory, ComplianceCertification) VALUES (?, ?, ?, ?)',
      [name, email, serviceCategory, compliance]
    );

    // Commit transaction
    await db.promise().commit();

    res.status(200).json({ success: true, message: 'Vendor registered successfully.' });
  } catch (error) {
    // Rollback transaction on error
    await db.promise().rollback();
    console.error('Error during vendor signup:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// other user signup route
app.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validate inputs
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Check if the email already exists
        const [existingUser] = await db.promise().query('SELECT * FROM Users WHERE Username = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email is already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        await db.promise().query(
            'INSERT INTO Users (Username, Password, Role) VALUES (?, ?, ?)',
            [email, hashedPassword, role]
        );

        // Respond with success
        res.json({ success: true });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    // Query the database for the user by email
    const [users] = await db.promise().query('SELECT * FROM Users WHERE Username = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const foundUser = users[0];

    // Compare the provided password with the hashed password in the database
    const isPasswordCorrect = await bcrypt.compare(password, foundUser.Password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Redirect URLs based on user role
    let redirectUrl;
    switch (foundUser.Role) {
      case 'Vendor':
        redirectUrl = '/Vendor/dashboard.html';
        break;
      case 'Procurement Manager':
        redirectUrl = '/Procurement_Manager/dashboard.html';
        break;
      case 'Contract Team':
        redirectUrl = '/Contract_Team/dashboard.html';
        break;
      case 'Finance Team':
        redirectUrl = '/Finance_Team/dashboard.html';
        break;
      case 'Department Head':
        redirectUrl = '/Department_Head/dashboard.html';
        break;
      case 'Admin':
        redirectUrl = '/Admin/dashboard.html';
        break;
      default:
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    res.json({ success: true, redirectUrl });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});


// Route to fetch all departments
app.get('/departments', async (req, res) => {
  try {
      const [departments] = await db.promise().query('SELECT * FROM Departments');
      res.status(200).json(departments);
  } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: 'Failed to fetch departments.' });
  }
});

// Route to fetch all vendors (already included in previous code)
app.get('/vendors', async (req, res) => {
  try {
      const [vendors] = await db.promise().query('SELECT * FROM Vendors');
      res.status(200).json(vendors);
  } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({ message: 'Failed to fetch vendors.' });
  }
});

// Route to fetch budget allocations
app.get('/budget-allocations', async (req, res) => {
  try {
      const query = `
          SELECT 
              ba.AllocationID, 
              d.Name AS DepartmentName, 
              v.Name AS VendorName, 
              ba.AmountAllocated, 
              ba.AllocationDate 
          FROM 
              BudgetAllocations ba
          JOIN Departments d ON ba.DepartmentID = d.DepartmentID
          JOIN Vendors v ON ba.VendorID = v.VendorID
          ORDER BY ba.AllocationDate DESC;
      `;
      const [rows] = await db.promise().query(query);
      res.json(rows);
  } catch (error) {
      console.error('Error fetching budget allocations:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// Route to handle budget allocation (already included in previous code)
app.post('/budget-allocation', async (req, res) => {
  const { departmentID, vendorID, amount } = req.body;

  // Validate inputs
  if (!departmentID || !vendorID || !amount) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
      // Insert the budget allocation into the database
      await db.promise().query(
          'INSERT INTO BudgetAllocations (DepartmentID, VendorID, AmountAllocated) VALUES (?, ?, ?)',
          [departmentID, vendorID, amount]
      );

      res.status(200).json({ success: true, message: 'Budget allocated successfully.' });
  } catch (error) {
      console.error('Error during budget allocation:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Route to fetch all vendors
app.get('/vendors', async (req, res) => {
  try {
      const [vendors] = await db.promise().query('SELECT VendorID, Name FROM Vendors');
      res.status(200).json(vendors);
  } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({ message: 'Failed to fetch vendors.' });
  }
});

// Route to create a contract
app.post('/create-contract', async (req, res) => {
  try {
      const { vendorID, startDate, endDate, terms } = req.body;

      if (!vendorID || !startDate || !endDate || !terms) {
          return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      await db.promise().query(
          'INSERT INTO Contracts (VendorID, StartDate, EndDate, Terms) VALUES (?, ?, ?, ?)',
          [vendorID, startDate, endDate, terms]
      );

      res.status(200).json({ success: true, message: 'Contract created successfully.' });
  } catch (error) {
      console.error('Error creating contract:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});


// Route to fetch all contracts
app.get('/contracts', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.ContractID, 
        c.StartDate, 
        c.EndDate, 
        c.Terms, 
        c.PerformanceRating, 
        v.Name AS VendorName
      FROM 
        Contracts c
      JOIN 
        Vendors v 
      ON 
        c.VendorID = v.VendorID
      ORDER BY 
        c.StartDate DESC;
    `;

    const [contracts] = await db.promise().query(query);
    res.status(200).json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error.message, error.stack);
    res.status(500).send({ message: 'Failed to fetch contracts.', error: error.message });
  }
});



// Fetch purchase orders

app.get('/vendors', (req, res) => {
  db.query('SELECT VendorID, Name FROM Vendors', (err, results) => {
      if (err) {
          console.error('Error fetching vendors:', err);
          res.status(500).send('Error fetching vendors');
      } else {
          res.json(results);
      }
  });
});




// Create purchase order
app.post('/create-purchase-order', (req, res) => {
  const { vendor, itemDetails, quantity, totalCost } = req.body;
  const query = 'INSERT INTO PurchaseOrders (VendorID, ItemDetails, Quantity, TotalCost) VALUES (?, ?, ?, ?)';
  db.query(query, [vendor, itemDetails, quantity, totalCost], (err, results) => {
      if (err) {
          console.error('Error creating purchase order:', err);
          res.status(500).send('Error creating purchase order');
      } else {
          res.status(201).send('Purchase order created');
      }
  });
});

// API to get purchase orders

app.get("/purchase-orders", (req, res) => {
  const query = `
      SELECT 
          PurchaseOrders.POID, 
          Vendors.Name, 
          PurchaseOrders.ItemDetails, 
          PurchaseOrders.Quantity, 
          CAST(PurchaseOrders.TotalCost AS DECIMAL(10,2)) AS TotalCost, 
          PurchaseOrders.Status 
      FROM 
          PurchaseOrders 
      JOIN 
          Vendors 
      ON 
          PurchaseOrders.VendorID = Vendors.VendorID
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error("Error fetching purchase orders:", err);
          res.status(500).json({ error: "Failed to load purchase orders" });
      } else {
          res.json(results);
      }
  });
});

app.get('/vendors', async (req, res) => {
  try {
      const [vendors] = await db.execute('SELECT VendorID, Name FROM Vendors');
      res.json(vendors);
  } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).send('Error fetching vendors');
  }
});

// Fetch vendor evaluations
app.get('/vendor-evaluations', (req, res) => {
  const query = `
      SELECT 
          vp.EvaluationID, 
          v.Name, 
          vp.QualityRating, 
          vp.PricingRating, 
          vp.TimelinessRating, 
          vp.PerformanceSummary, 
          vp.EvaluationDate
      FROM VendorPerformance vp
      JOIN Vendors v ON vp.VendorID = v.VendorID
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error("Error fetching evaluations:", err);
          res.status(500).json({ error: "Failed to load evaluations" });
      } else {
          res.json(results);
      }
  });
});

// Create a new evaluation
app.post('/create-evaluation', (req, res) => {
  const { vendorId, qualityRating, pricingRating, timelinessRating, performanceSummary } = req.body;

  const query = `
      INSERT INTO VendorPerformance (VendorID, QualityRating, PricingRating, TimelinessRating, PerformanceSummary)
      VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [vendorId, qualityRating, pricingRating, timelinessRating, performanceSummary], (err) => {
      if (err) {
          console.error("Error creating evaluation:", err);
          res.status(500).json({ error: "Failed to create evaluation" });
      } else {
          res.status(201).send("Evaluation created successfully");
      }
  });
});


app.post('/vendor-evaluations', async (req, res) => {
  const { vendorId, qualityRating, pricingRating, timelinessRating, performanceSummary } = req.body;

  try {
      await db.execute(
          'INSERT INTO VendorPerformance (VendorID, QualityRating, PricingRating, TimelinessRating, PerformanceSummary) VALUES (?, ?, ?, ?, ?)',
          [vendorId, qualityRating, pricingRating, timelinessRating, performanceSummary]
      );
      res.status(201).send('Evaluation added successfully');
  } catch (error) {
      console.error('Error adding evaluation:', error);
      res.status(500).send('Error adding evaluation');
  }
});

app.get('/vendors-with-ratings', (req, res) => {
  const query = `
      SELECT 
          v.VendorID,
          v.Name,
          v.ServiceCategory,
          'Active' AS Status,
          AVG((vp.QualityRating + vp.PricingRating + vp.TimelinessRating) / 3) AS AverageRating
      FROM Vendors v
      LEFT JOIN VendorPerformance vp ON v.VendorID = vp.VendorID
      GROUP BY v.VendorID, v.Name, v.ServiceCategory
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching vendors with ratings:', err);
          res.status(500).json({ error: 'Failed to fetch vendor data' });
      } else {
          console.log('Query Results:', results); // Log results
          res.json(results);
      }
  });
});



app.get('/budget-allocations-with-expenses', (req, res) => {
  const query = `
      SELECT 
          ba.AllocationID,
          (SELECT Name FROM Departments WHERE DepartmentID = ba.DepartmentID) AS DepartmentName,
          (SELECT Name FROM Vendors WHERE VendorID = ba.VendorID) AS VendorName,
          CAST(ba.AmountAllocated AS DECIMAL(10,2)) AS AmountAllocated,
          COALESCE(SUM(e.AmountSpent), 0) AS TotalExpenses
      FROM BudgetAllocations ba
      LEFT JOIN Expenses e ON ba.AllocationID = e.AllocationID
      GROUP BY ba.AllocationID, ba.DepartmentID, ba.VendorID, ba.AmountAllocated
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching budget allocations:', err);
          res.status(500).json({ error: 'Failed to fetch budget allocations' });
      } else {
          res.json(results);
      }
  });
});



app.post('/budget-allocations-with-expenses', (req, res) => {
  const { AllocationID, AmountSpent } = req.body;

  if (!AllocationID || !AmountSpent) {
    return res.status(400).json({ error: 'Allocation ID and Amount Spent are required' });
  }

  const query = `
      INSERT INTO Expenses (AllocationID, AmountSpent) 
      VALUES (?, ?)
  `;

  db.query(query, [AllocationID, AmountSpent], (err, result) => {
    if (err) {
      console.error('Error inserting expense:', err.message);
      res.status(500).json({ error: 'Failed to insert expense' });
    } else {
      res.status(201).json({ message: 'Expense added successfully', ExpenseID: result.insertId });
    }
  });
});

app.get('/dashboard-data-finance', (req, res) => {
  // Query to fetch total allocated budget and total expenses
  const query = `
  SELECT 
    SUM(ba.AmountAllocated) AS TotalBudget, 
    COALESCE(SUM(e.AmountSpent), 0) AS TotalExpenses
  FROM BudgetAllocations ba
  LEFT JOIN Expenses e ON ba.AllocationID = e.AllocationID
`;

db.query(query, (err, results) => {
  if (err) {
    console.error('Error fetching dashboard data:', err);
    return res.status(500).json({ error: 'Failed to load dashboard data' });
  }

  // Ensure numeric values for budget and expenses
  const totalBudget = parseFloat(results[0].TotalBudget) || 0; // Default to 0 if null or NaN
  const totalExpenses = parseFloat(results[0].TotalExpenses) || 0; // Default to 0 if null or NaN

  // Calculate outstanding invoices (should not be negative)
  let outstandingInvoices = totalExpenses - totalBudget;

  // If expenses exceed the budget, set outstanding invoices to 0
  if (outstandingInvoices < 0) {
    outstandingInvoices = 0;
  }



  // Return the calculated data in the response
  res.json({
    totalBudget,
    totalExpenses,
    outstandingInvoices
  });
});

});

app.get('/contracts', (req, res) => {
  res.set('Cache-Control', 'no-store'); // Disable caching
  const query = `
    SELECT 
      c.ContractID,
      c.StartDate,
      c.EndDate,
      c.Terms,
      v.Name AS VendorName,
      ca.Status,
      ca.Notes
    FROM Contracts c
    JOIN Vendors v ON c.VendorID = v.VendorID
    LEFT JOIN ContractApproval ca ON c.ContractID = ca.ContractID
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching contracts:', err);
      return res.status(500).json({ error: 'Failed to load contracts' });
    }

    res.json(results);
  });
});

app.post('/approve-contract', (req, res) => {
  const { contractID, status, notes } = req.body;

  if (!contractID || !status) {
    return res.status(400).json({ error: 'Contract ID and status are required.' });
  }

  const query = `
    INSERT INTO ContractApproval (ContractID, Status, ApprovalDate, Notes)
    VALUES (?, ?, CURDATE(), ?)
    ON DUPLICATE KEY UPDATE 
    Status = VALUES(Status), 
    ApprovalDate = VALUES(ApprovalDate), 
    Notes = VALUES(Notes)
  `;

  db.query(query, [contractID, status, notes], (err, results) => {
    if (err) {
      console.error('Error approving/rejecting contract:', err);
      return res.status(500).json({ error: 'Failed to update contract status' });
    }
    res.json({ success: true, message: 'Contract updated successfully.' });
  });
});


// Add a route to fetch data for the Department Head dashboard
app.get('/department-dashboard', (req, res) => {
  const query = `
SELECT 
    (SELECT COUNT(*) 
     FROM Contracts 
     WHERE ContractID IN (SELECT ContractID FROM ContractApproval WHERE Status = 'Active')) AS ActiveContracts,
     
    (SELECT COUNT(*) 
     FROM ContractApproval 
     WHERE Status = 'Rejected') AS PendingReview,
     
    (SELECT COUNT(*) 
     FROM ContractApproval 
     WHERE Status = 'Active') AS CompletedReviews;

  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching department dashboard data:', err);
      return res.status(500).json({ error: 'Failed to load dashboard data' });
    }

    // Ensure data is valid
    const data = results[0];
    res.json({
      activeContracts: data.ActiveContracts || 0,
      pendingReview: data.PendingReview || 0,
      completedReviews: data.CompletedReviews || 0
    });
  });
});


app.get('/get-departments', (req, res) => {
  const query = 'SELECT * FROM Departments';
  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching departments:', err);
          return res.status(500).json({ error: 'Failed to fetch departments' });
      }
      res.json(results); // Return departments as JSON
  });
});

// Route to adjust the budget
app.post('/adjust-budget', (req, res) => {
  const { departmentID, action, amount } = req.body;
  if (isNaN(departmentID) || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid input' });
  }

  let query;
  if (action === 'increase') {
      query = 'UPDATE Departments SET Budget = Budget + ? WHERE DepartmentID = ?';
  } else if (action === 'decrease') {
      query = 'UPDATE Departments SET Budget = Budget - ? WHERE DepartmentID = ?';
  } else {
      return res.status(400).json({ error: 'Invalid action' });
  }

  db.query(query, [amount, departmentID], (err, result) => {
      if (err) {
          console.error('Error adjusting budget:', err);
          return res.status(500).json({ error: 'Failed to adjust budget' });
      }
      res.json({ success: true });
  });
});



// Endpoint to get orders by VendorID
app.get('/get-orders/:vendorID', (req, res) => {
  const vendorID = req.params.vendorID;
  const query = `SELECT * FROM PurchaseOrders WHERE VendorID = ?`;

  db.query(query, [vendorID], (err, results) => {
      if (err) {
          res.status(500).json({ error: 'Error fetching orders' });
      } else {
          res.json(results);
      }
  });
});

// Endpoint to update order status
app.post('/update-order-status/:orderID', (req, res) => {
  const orderID = req.params.orderID;
  const { status } = req.body;
  const query = `UPDATE PurchaseOrders SET Status = ? WHERE POID = ?`;

  db.query(query, [status, orderID], (err, results) => {
      if (err) {
          res.status(500).json({ error: 'Error updating order status' });
      } else {
          res.json({ success: true });
      }
  });
});


// Get Vendor Performance by VendorID
app.get('/get-vendor-performance/:vendorID', (req, res) => {
  const vendorID = req.params.vendorID;
  const query = `SELECT QualityRating, PricingRating, TimelinessRating FROM VendorPerformance WHERE VendorID = ? ORDER BY EvaluationDate DESC LIMIT 1`;

  db.query(query, [vendorID], (err, results) => {
      if (err) {
          res.status(500).json({ error: 'Error fetching performance data' });
      } else {
          res.json(results[0]);
      }
  });
});

// Get Order Completion Percentage
app.get('/get-order-completion/:vendorID', (req, res) => {
  const vendorID = req.params.vendorID;
  const query = `SELECT Status FROM PurchaseOrders WHERE VendorID = ?`;

  db.query(query, [vendorID], (err, results) => {
      if (err) {
          res.status(500).json({ error: 'Error fetching order data' });
      } else {
          const totalOrders = results.length;
          const completedOrders = results.filter(order => order.Status === 'Fulfilled').length;
          const completionPercentage = (completedOrders / totalOrders) * 100;
          res.json({ completionPercentage });
      }
  });
});

const uploadDir = path.join(__dirname, 'uploads', 'certificates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// API to handle file upload
app.post('/upload-certification', upload.single('cert-file'), (req, res) => {
  if (!req.file) {
      return res.status(400).send('No file uploaded.');
  }
  res.send({ message: 'File uploaded successfully!', filePath: req.file.path });
});

// Create an endpoint to serve uploaded certifications (optional)
app.get('/certificates/:filename', (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, 'uploads/certificates', filename));
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API to fetch list of certifications
app.get('/certifications', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads', 'certificates');

    // Read the files from the directory
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Unable to fetch certifications.' });
        }
        const fileData = files.map(file => ({
            name: file,
            path: `/uploads/certificates/${file}` // Provide the path for accessing the file
        }));
        res.json(fileData);
    });
});



// API: Fetch dashboard metrics
app.get('/dashboard-metrics', (req, res) => {
  const queries = {
      totalVendors: 'SELECT COUNT(*) AS count FROM Vendors',
      activeContracts: `
          SELECT COUNT(*) AS count 
          FROM Contracts 
          WHERE StartDate <= CURDATE() AND EndDate >= CURDATE()`,
      purchaseOrders: 'SELECT COUNT(*) AS count FROM PurchaseOrders',
      averageRating: 'SELECT AVG(PerformanceRating) AS avgRating FROM Contracts WHERE PerformanceRating IS NOT NULL'
  };

  const results = {};
  const queryPromises = Object.entries(queries).map(([key, query]) =>
      new Promise((resolve, reject) => {
          db.query(query, (err, rows) => {
              if (err) reject(err);
              results[key] = rows[0].count || rows[0].avgRating || 0;
              resolve();
          });
      })
  );

  Promise.all(queryPromises)
      .then(() => res.json(results))
      .catch((err) => res.status(500).json({ error: 'Error fetching metrics', details: err }));
});



app.get('/vendor-performance', (req, res) => {
  const query = `
      SELECT V.Name, AVG(VP.QualityRating + VP.PricingRating + VP.TimelinessRating) / 3 AS avgRating
      FROM Vendors V
      LEFT JOIN VendorPerformance VP ON V.VendorID = VP.VendorID
      GROUP BY V.VendorID, V.Name
      ORDER BY avgRating DESC`;

  db.query(query, (err, rows) => {
      if (err) {
          return res.status(500).json({ error: 'Error fetching vendor performance data', details: err });
      }
      res.json(rows);
  });
});



app.get('/order-status', (req, res) => {
  const query = `
      SELECT Status, COUNT(*) AS count
      FROM PurchaseOrders
      GROUP BY Status`;

  db.query(query, (err, rows) => {
      if (err) {
          return res.status(500).json({ error: 'Error fetching order status data', details: err });
      }
      const statusData = rows.reduce((acc, row) => {
          acc[row.Status] = row.count;
          return acc;
      }, {});
      res.json(statusData);
  });
});



app.get('/contracts', (req, res) => {
  const query = `
      SELECT 
          c.ContractID,
          v.Name AS VendorName,
          c.StartDate,
          c.EndDate,
          ca.Status
      FROM Contracts c
      JOIN Vendors v ON c.VendorID = v.VendorID
      LEFT JOIN ContractApproval ca ON c.ContractID = ca.ContractID
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching contracts:', err);
          res.status(500).json({ error: 'Failed to fetch contracts' });
      } else {
          res.json(results);
      }
  });
});


app.post('/send-notification', (req, res) => {
  const { userID, relatedEntity, message } = req.body;

  if (!userID || !relatedEntity || !message) {
      return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
      INSERT INTO Notifications (UserID, RelatedEntity, Message) 
      VALUES (?, ?, ?)
  `;

  db.query(query, [userID, relatedEntity, message], (err, results) => {
      if (err) {
          console.error('Error sending notification:', err);
          res.status(500).json({ error: 'Failed to send notification' });
      } else {
          res.json({ success: true, message: 'Notification sent successfully' });
      }
  });
});
app.get('/users', (req, res) => {
  const query = `SELECT UserID, Username, Role FROM Users`;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching users:', err);
          res.status(500).json({ error: 'Failed to fetch users' });
      } else {
          res.json(results);
      }
  });
});


app.get('/notifications', (req, res) => {
  const query = `
      SELECT NotificationID, Message, Date 
      FROM Notifications 
      ORDER BY Date DESC
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching notifications:', err);
          return res.status(500).json({ error: 'Failed to fetch notifications' });
      }
      res.json(results);
  });
});

// Fetch contract dashboard data
app.get('/contract-dashboard', (req, res) => {
  const query = `
      SELECT 
          (SELECT COUNT(*) FROM Contracts c JOIN ContractApproval ca ON c.ContractID = ca.ContractID WHERE ca.Status = 'Active') AS TotalActiveContracts,
          (SELECT COUNT(*) FROM Contracts c JOIN ContractApproval ca ON c.ContractID = ca.ContractID WHERE ca.Status = 'Pending') AS ContractsUnderReview,
          (SELECT COUNT(*) FROM Contracts c JOIN ContractApproval ca ON c.ContractID = ca.ContractID WHERE ca.Status = 'Pending') AS ContractsPendingApproval
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching contract dashboard data:', err);
          return res.status(500).json({ error: 'Failed to load contract dashboard data' });
      }

      if (results.length > 0) {
          const data = results[0];
          res.json({
              totalActiveContracts: data.TotalActiveContracts || 0,
              contractsUnderReview: data.ContractsUnderReview || 0,
              contractsPendingApproval: data.ContractsPendingApproval || 0
          });
      } else {
          res.json({
              totalActiveContracts: 0,
              contractsUnderReview: 1,
              contractsPendingApproval: 1
          });
      }
  });
});



// Fetch admin dashboard data
app.get('/admin-dashboard', (req, res) => {
  const query = `
      SELECT 
          (SELECT COUNT(*) FROM Users) AS TotalUsers,
          (SELECT COUNT(*) FROM Contracts c JOIN ContractApproval ca ON c.ContractID = ca.ContractID WHERE ca.Status = 'Active') AS TotalActiveContracts,
          (SELECT COUNT(*) FROM ContractApproval WHERE Status = 'Active') AS PendingApprovals
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching admin dashboard data:', err);
          return res.status(500).json({ error: 'Failed to load admin dashboard data' });
      }

      if (results.length > 0) {
          const data = results[0];
          res.json({
              totalUsers: data.TotalUsers || 0,
              totalActiveContracts: data.TotalActiveContracts || 0,
              pendingApprovals: data.PendingApprovals || 0
          });
      } else {
          res.json({
              totalUsers: 0,
              totalActiveContracts: 0,
              pendingApprovals: 0
          });
      }
  });
});


// Fetch all users with full details
app.get('/users', (req, res) => {
  const query = `
      SELECT 
          UserID, 
          Username, 
          Role, 
          CreatedAt
      FROM Users
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching users:', err);
          return res.status(500).json({ error: 'Failed to fetch users' });
      }

      res.json(results);
  });
});
app.get('/notifications-finance', (req, res) => {
  const role = req.query.role;

  const query = `
      SELECT Notifications.NotificationID, Notifications.Message, Notifications.Date 
      FROM Notifications 
      JOIN Users ON Notifications.UserID = Users.UserID 
      WHERE Users.Role = 'Finance Team'
      ORDER BY Notifications.Date DESC
  `;

  db.query(query, [role], (err, results) => {
      if (err) {
          console.error('Error fetching notifications:', err);
          return res.status(500).json({ error: 'Failed to fetch notifications' });
      }
      res.json(results);
  });
});

app.get('/notifications-contract', (req, res) => {
  const role = req.query.role;

  const query = `
      SELECT Notifications.NotificationID, Notifications.Message, Notifications.Date 
      FROM Notifications 
      JOIN Users ON Notifications.UserID = Users.UserID 
      WHERE Users.Role = 'Contract Team'
      ORDER BY Notifications.Date DESC
  `;

  db.query(query, [role], (err, results) => {
      if (err) {
          console.error('Error fetching notifications:', err);
          return res.status(500).json({ error: 'Failed to fetch notifications' });
      }
      res.json(results);
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
