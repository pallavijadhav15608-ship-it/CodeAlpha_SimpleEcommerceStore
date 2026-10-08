let products = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let selectedProduct = null;

// ===============================
// API
// ===============================

async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || "Something went wrong.");
    }

    return data;
}


// ===============================
// LOAD PRODUCTS
// ===============================

async function loadProducts() {
    try {
        const response = await api("/api/products");

        products = response;

        displayProducts();

        renderCart();

    } catch (error) {
        console.error(error);
        document.getElementById("productList").innerHTML =
            "<p>Could not load products.</p>";
    }
}


// ===============================
// DISPLAY PRODUCTS
// ===============================

function displayProducts() {

    const productList = document.getElementById("productList");

    productList.innerHTML = "";

    products.forEach(product => {

        const productDiv = document.createElement("div");

        productDiv.className = "product";

        productDiv.innerHTML = `
            <div class="image">🛍️</div>

            <h3>${product.name}</h3>

            <p>${product.description}</p>

            <div class="price">
                ₹${Number(product.price).toFixed(2)}
            </div>

            <button onclick="viewProduct(${product.id})">
                View Details
            </button>

            <button onclick="addToCart(${product.id})">
                Add to Cart
            </button>
        `;

        productList.appendChild(productDiv);
    });
}


// ===============================
// PRODUCT DETAILS
// ===============================

function viewProduct(productId) {

    selectedProduct = products.find(
        product => product.id === productId
    );

    if (!selectedProduct) {
        alert("Product not found.");
        return;
    }

    document.getElementById("detailName").textContent =
        selectedProduct.name;

    document.getElementById("detailDescription").textContent =
        selectedProduct.description;

    document.getElementById("detailPrice").textContent =
        Number(selectedProduct.price).toFixed(2);

    document.getElementById("productDetailsBox").style.display = "flex";
}

function closeProductDetails() {

    document.getElementById("productDetailsBox").style.display = "none";
}

function addDetailProductToCart() {

    if (!selectedProduct) return;

    addToCart(selectedProduct.id);

    closeProductDetails();
}


// ===============================
// CART
// ===============================

function addToCart(productId) {

    const existing = cart.find(
        item => item.productId === productId
    );

    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({
            productId: productId,
            quantity: 1
        });
    }

    saveCart();

    alert("Product added to cart!");
}

function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    renderCart();
}

function renderCart() {

    const cartCount =
        document.getElementById("cartCount");

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");

    const count = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cartCount.textContent = count;

    if (cart.length === 0) {

        cartItems.innerHTML =
            "<p>Your cart is empty.</p>";

        cartTotal.textContent = "0.00";

        return;
    }

    let total = 0;

    cartItems.innerHTML = "";

    cart.forEach(item => {

        const product = products.find(
            p => p.id === item.productId
        );

        if (!product) return;

        total += product.price * item.quantity;

        cartItems.innerHTML += `
            <div class="cart-item">

                <span>
                    <strong>${product.name}</strong>
                    <br>
                    ₹${product.price} × ${item.quantity}
                </span>

                <span>
                    <button onclick="changeQuantity(${product.id}, -1)">
                        −
                    </button>

                    <button onclick="changeQuantity(${product.id}, 1)">
                        +
                    </button>

                    <button onclick="removeFromCart(${product.id})">
                        ❌
                    </button>
                </span>

            </div>
        `;
    });

    cartTotal.textContent =
        total.toFixed(2);
}

function changeQuantity(productId, amount) {

    const item = cart.find(
        item => item.productId === productId
    );

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {

        cart = cart.filter(
            item => item.productId !== productId
        );
    }

    saveCart();
}

function removeFromCart(productId) {

    cart = cart.filter(
        item => item.productId !== productId
    );

    saveCart();
}


// ===============================
// SHOW / CLOSE CART
// ===============================

function showCart() {

    document.getElementById("cartBox").style.display = "flex";

    renderCart();
}

function closeCart() {

    document.getElementById("cartBox").style.display = "none";
}


// ===============================
// LOGIN / REGISTER
// ===============================

function showRegister() {

    document.getElementById("registerBox").style.display = "flex";
}

function showLogin() {

    document.getElementById("loginBox").style.display = "flex";
}

function closeAuth() {

    document.getElementById("loginBox").style.display = "none";

    document.getElementById("registerBox").style.display = "none";
}


// ===============================
// REGISTER
// ===============================

async function registerUser() {

    const name =
        document.getElementById("registerName").value;

    const email =
        document.getElementById("registerEmail").value;

    const password =
        document.getElementById("registerPassword").value;

    if (!name || !email || !password) {

        alert("Please fill all fields.");

        return;
    }

    try {

        const data = await api("/api/register", {

            method: "POST",

            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        alert(data.message);

        if (data.userId) {

            closeAuth();

            document.getElementById("registerName").value = "";
            document.getElementById("registerEmail").value = "";
            document.getElementById("registerPassword").value = "";
        }

    } catch (error) {

        alert(error.message);
    }
}


// ===============================
// LOGIN
// ===============================

async function loginUser() {

    const email =
        document.getElementById("loginEmail").value;

    const password =
        document.getElementById("loginPassword").value;

    if (!email || !password) {

        alert("Please enter email and password.");

        return;
    }

    try {

        const data = await api("/api/login", {

            method: "POST",

            body: JSON.stringify({
                email,
                password
            })
        });

        currentUser = data.user;

        localStorage.setItem(
            "user",
            JSON.stringify(currentUser)
        );

        closeAuth();

        alert(
            "Welcome " + currentUser.name + "!"
        );

    } catch (error) {

        alert(error.message);
    }
}


// ===============================
// CHECKOUT / PLACE ORDER
// ===============================

async function checkout() {

    if (!currentUser) {

        closeCart();

        alert("Please login before placing an order.");

        showLogin();

        return;
    }

    if (cart.length === 0) {

        alert("Your cart is empty!");

        return;
    }

    try {

        const items = cart.map(item => {

            const product = products.find(
                p => p.id === item.productId
            );

            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            };
        });

        const data = await api("/api/orders", {

            method: "POST",

            body: JSON.stringify({
                userId: currentUser.id,
                items: items
            })
        });

        cart = [];

        saveCart();

        closeCart();

        alert(
            `Order #${data.orderId} placed successfully! Total: ₹${Number(data.total).toFixed(2)}`
        );

    } catch (error) {

        alert(error.message);
    }
}


// ===============================
// START APPLICATION
// ===============================

loadProducts();