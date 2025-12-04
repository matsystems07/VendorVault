// server.js (POSTGRES VERSION – Uses ONLY ENV VARS)

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// ---------------- STATIC FOLDERS ----------------
app.use('/Vendor', express.static(path.join(__dirname, 'Vendor')));
app.use('/Procurement_Manager', express.static(path.join(__dirname, 'Procurement_Manager')));
app.use('/Contract_Team', express.static(path.join(__dirname, 'Contract_Team')));
app.use('/Finance_Team', express.static(path.join(__dirname, 'Finance_Team')));
app.use('/Department_Head', express.static(path.join(__dirname, 'Department_Head')));
app.use('/Admin', express.static(path.join(__dirname, 'Admin')));
app.use('/Login_Signup_Pages', express.static(path.join(__dirname, 'Login_Signup_Pages')));

// ---------------- POSTGRES CONNECTION ----------------
// Everything now reads from environment variables.
const db = new Pool({
    connectionString: process.env.DATABASE_URL,  // Render provides this
    ssl: process.env.PG_SSL === "false" ? false : { rejectUnauthorized: false }
});

// ---------------- ROUTES ----------------

// Login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend-Backend/Login_Signup_Pages/login.html'));

});

// Vendor register page
app.get('/register-vendor.html', (req, res) =>
    res.sendFile(path.join(__dirname, '../Frontend-Backend/Login_Signup_Pages/register-vendor.html'))
);

// ---------------- VENDOR SIGNUP ----------------
app.post('/vendor-signup', async (req, res) => {
    const { name, email, password, serviceCategory, compliance } = req.body;

    if (!name || !email || !password || !serviceCategory || !compliance)
        return res.status(400).json({ success: false, message: 'All fields required' });

    try {
        const existing = await db.query(
            'SELECT * FROM Users WHERE Username = $1',
            [email]
        );

        if (existing.rows.length > 0)
            return res.status(400).json({ success: false, message: 'Email already used' });

        const hashed = await bcrypt.hash(password, 10);

        await db.query('BEGIN');

        await db.query(
            `INSERT INTO Users (Username, Password, Role)
             VALUES ($1, $2, $3)`,
            [email, hashed, 'Vendor']
        );

        await db.query(
            `INSERT INTO Vendors (Name, ContactInfo, ServiceCategory, ComplianceCertification)
             VALUES ($1, $2, $3, $4)`,
            [name, email, serviceCategory, compliance]
        );

        await db.query('COMMIT');

        res.json({ success: true, message: 'Vendor Registered Successfully' });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// ---------------- OTHER USER SIGNUP ----------------
app.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role)
        return res.status(400).json({ success: false, message: "All fields required" });

    try {
        const existing = await db.query(
            'SELECT * FROM Users WHERE Username = $1',
            [email]
        );

        if (existing.rows.length > 0)
            return res.status(400).json({ success: false, message: "Email already used" });

        const hashed = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO Users (Username, Password, Role)
             VALUES ($1, $2, $3)`,
            [email, hashed, role]
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ---------------- LOGIN ----------------
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ success: false, message: 'Missing credentials' });

    try {
        const userQuery = await db.query(
            'SELECT * FROM Users WHERE Username = $1',
            [email]
        );

        if (userQuery.rows.length === 0)
            return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const user = userQuery.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.status(401).json({ success: false, message: 'Invalid credentials' });

        let redirectUrl = '';
        switch (user.role) {
            case 'Vendor': redirectUrl = '/Vendor/dashboard.html'; break;
            case 'Procurement Manager': redirectUrl = '/Procurement_Manager/dashboard.html'; break;
            case 'Contract Team': redirectUrl = '/Contract_Team/dashboard.html'; break;
            case 'Finance Team': redirectUrl = '/Finance_Team/dashboard.html'; break;
            case 'Department Head': redirectUrl = '/Department_Head/dashboard.html'; break;
            case 'Admin': redirectUrl = '/Admin/dashboard.html'; break;
            default:
                return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, redirectUrl });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// ---------------- FETCH DEPARTMENTS ----------------
app.get('/departments', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Departments');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
});

// ---------------- FETCH VENDORS ----------------
app.get('/vendors', async (req, res) => {
    try {
        const result = await db.query('SELECT VendorID, Name FROM Vendors');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching vendors');
    }
});

// ---------------- CREATE CONTRACT ----------------
app.post('/create-contract', async (req, res) => {
    const { vendorID, startDate, endDate, terms } = req.body;

    try {
        await db.query(
            `INSERT INTO Contracts (VendorID, StartDate, EndDate, Terms)
             VALUES ($1, $2, $3, $4)`,
            [vendorID, startDate, endDate, terms]
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// ---------------- FETCH CONTRACTS ----------------
app.get('/contracts', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.ContractID,
                c.StartDate,
                c.EndDate,
                c.Terms,
                c.PerformanceRating,
                v.Name AS VendorName
            FROM Contracts c
            JOIN Vendors v ON c.VendorID = v.VendorID
            ORDER BY c.StartDate DESC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch contracts' });
    }
});

// ---------------- PURCHASE ORDER ----------------
app.post('/create-purchase-order', async (req, res) => {
    const { vendor, itemDetails, quantity, totalCost } = req.body;

    try {
        await db.query(
            `INSERT INTO PurchaseOrders (VendorID, ItemDetails, Quantity, TotalCost)
             VALUES ($1, $2, $3, $4)`,
            [vendor, itemDetails, quantity, totalCost]
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating order');
    }
});

// ---------------- FETCH PURCHASE ORDERS ----------------
app.get('/purchase-orders', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                po.POID,
                v.Name,
                po.ItemDetails,
                po.Quantity,
                po.TotalCost,
                po.Status
            FROM PurchaseOrders po
            JOIN Vendors v ON po.VendorID = v.VendorID
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading orders');
    }
});

// ---------------- EVALUATION ----------------
app.post('/create-evaluation', async (req, res) => {
    const { vendorId, qualityRating, pricingRating, timelinessRating, performanceSummary } = req.body;

    try {
        await db.query(
            `INSERT INTO VendorPerformance 
             (VendorID, QualityRating, PricingRating, TimelinessRating, PerformanceSummary)
             VALUES ($1, $2, $3, $4, $5)`,
            [vendorId, qualityRating, pricingRating, timelinessRating, performanceSummary]
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding evaluation');
    }
});

// ---------------- START SERVER ----------------
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
