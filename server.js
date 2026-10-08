const express = require("express");
const bcrypt = require("bcryptjs");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// ADD SAMPLE PRODUCTS
// ==========================================

const productCount = db
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get();

if (productCount.count === 0) {
    const insert = db.prepare(
        "INSERT INTO products (name, price, description) VALUES (?, ?, ?)"
    );

    insert.run(
        "Laptop",
        55000,
        "Powerful laptop for work and study."
    );

    insert.run(
        "Smartphone",
        25000,
        "Modern smartphone with excellent features."
    );

    insert.run(
        "Headphones",
        2500,
        "Wireless headphones with clear sound."
    );

    insert.run(
        "Smart Watch",
        4000,
        "Smart watch for fitness and daily activities."
    );
}

// ==========================================
// GET ALL PRODUCTS
// ==========================================

app.get("/api/products", (req, res) => {
    try {
        const products = db
            .prepare("SELECT * FROM products")
            .all();

        res.json(products);
    } catch (error) {
        console.error("Products error:", error);

        res.status(500).json({
            message: "Could not load products."
        });
    }
});

// ==========================================
// REGISTER USER
// ==========================================

app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = db.prepare(
            `INSERT INTO users (name, email, password)
             VALUES (?, ?, ?)`
        ).run(
            name,
            email,
            hashedPassword
        );

        res.json({
            message: "Registration successful!",
            userId: result.lastInsertRowid
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(400).json({
            message: "Email already registered."
        });
    }
});

// ==========================================
// LOGIN USER
// ==========================================

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    try {
        // Find user by email
        const user = db.prepare(
            "SELECT * FROM users WHERE email = ?"
        ).get(email);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed."
        });
    }
});

// ==========================================
// PLACE ORDER
// ==========================================

app.post("/api/orders", (req, res) => {
    const { userId, items } = req.body;

    if (!userId || !items || items.length === 0) {
        return res.status(400).json({
            message: "User and cart items are required."
        });
    }

    try {
        let total = 0;

        // Calculate total
        items.forEach(item => {
            total += Number(item.price) * Number(item.quantity);
        });

        // Create order
        const order = db.prepare(
            `INSERT INTO orders (user_id, total)
             VALUES (?, ?)`
        ).run(
            userId,
            total
        );

        const orderId = order.lastInsertRowid;

        // Insert order items
        const insertItem = db.prepare(
            `INSERT INTO order_items
            (order_id, product_id, quantity, price)
            VALUES (?, ?, ?, ?)`
        );

        items.forEach(item => {
            insertItem.run(
                orderId,
                item.productId,
                item.quantity,
                item.price
            );
        });

        res.json({
            message: "Order placed successfully!",
            orderId: orderId,
            total: total
        });

    } catch (error) {
        console.error("Order error:", error);

        res.status(500).json({
            message: "Could not place order."
        });
    }
});

// ==========================================
// GET USER ORDERS
// ==========================================

app.get("/api/orders/:userId", (req, res) => {
    try {
        const orders = db.prepare(
            `SELECT *
             FROM orders
             WHERE user_id = ?
             ORDER BY created_at DESC`
        ).all(req.params.userId);

        res.json(orders);

    } catch (error) {
        console.error("Orders error:", error);

        res.status(500).json({
            message: "Could not load orders."
        });
    }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(
        `Server running at http://localhost:${PORT}`
    );
});