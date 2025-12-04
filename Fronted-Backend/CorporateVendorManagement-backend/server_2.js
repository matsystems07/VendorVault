const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt'); // For password hashing

const app = express();
const port = 3000;

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
