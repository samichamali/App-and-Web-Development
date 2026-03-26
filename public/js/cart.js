const container = document.getElementById('cart-items-container');
const totalDisplay = document.getElementById('cart-total');

async function displayCart() {
    try {
        // Fetches the entire list of products from this api
        const response = await fetch('/api/products');
        const allProducts = await response.json();

        // This is a list of selected product ID's stored in LocalStorage
        const cartIds = JSON.parse(localStorage.getItem('appleCart')) || [];

        if (cartIds.length === 0) {
            container.innerHTML = "<h2>Your bag is empty.</h2>";
            totalDisplay.innerText = "Total: $0";
            return;
        }

        // We filter using ID's from LocalStorage and place them in the List inside the view cart section
        const cartProducts = cartIds.map(id => {
            return allProducts.find(product => product._id === id);
        }).filter(item => item !== undefined); // Remove anything not detected in the products list.

        // After all that, we Render the filtered list
        renderCart(cartProducts);

    } catch (error) {
        container.innerHTML = "<p>Unable to obtain</p>";
    }
}

function renderCart(items) {
    container.innerHTML = '';
    let total = 0;

    items.forEach((item, index) => {
        total += item.price;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'product-card';
        // Setting the information displayed in the elements to show in the cart list
        itemDiv.innerHTML = `
            <div class="product-image">
                <img src="${item.image}" style="width: 100px;">
            </div>
            <div class="product-info">
                <h3>${item.name}</h3>
                <p>$${item.price}</p>
                <button onclick="removeItem(${index})" style="color: #ff3b30; cursor: pointer; border: none; background: none;">Remove</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });


    // If no account information was seen, the user will be informed to sign in before proceeding with their purchase
    totalDisplay.innerText = `Total: $${total}`;
    const footer = document.getElementById('cart-footer');
    const token = localStorage.getItem('token');

    if (!token) {
        footer.innerHTML = `
            <p>Please <a href="/login.html">Sign In</a> to proceed with your purchase</p>
        `;
    } else {
        footer.innerHTML = `
            <div class="total-line"><span>Total</span><span id="cart-total">$${total}</span></div>
            <button onclick="processCheckout()" class="checkout-btn">Check Out</button>
        `;
    }
}

function removeItem(index) {
    let cartIds = JSON.parse(localStorage.getItem('appleCart'));
    cartIds.splice(index, 1);
    localStorage.setItem('appleCart', JSON.stringify(cartIds));
    displayCart(); // rerun the entire process when an item is removed to display the new updates.
}

async function processCheckout() {
    const overlay = document.getElementById('payment-overlay');
    const loadingSection = document.getElementById('payment-loading');
    const successSection = document.getElementById('payment-success');

    overlay.style.display = 'flex';

    // 1. Prepare the data
    const cartIds = JSON.parse(localStorage.getItem('appleCart')) || [];
    const token = localStorage.getItem('token');

    try {
        // 2. Send the transaction to the MongoDB backend
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productIds: cartIds })
        });

        if (response.ok) {
            // 3. If DB saved successfully, show the "Success" UI after a delay
            setTimeout(() => {
                loadingSection.style.display = 'none';
                successSection.style.display = 'block';
                localStorage.removeItem('appleCart'); // Only clear if DB saved
            }, 2000);
        } else {
            alert("Payment went through, but we couldn't save the order. Contact support.");
        }
    } catch (err) {
        console.error("Database error:", err);
        overlay.style.display = 'none';
        alert("Server connection failed.");
    }
}

function finishOrder() {
    window.location.href = 'index.html';
}

async function displayOrderHistory() {
    const container = document.getElementById('order-history-container');
    const token = localStorage.getItem('token');

    if (!token) {
        container.innerHTML = "<p>Sign in to see your order history.</p>";
        return;
    }

    try {
        const response = await fetch('/api/transactions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await response.json();

        if (orders.length === 0) {
            container.innerHTML = "<p style='color: #86868b;'>No Orders Yet.</p>";
            return;
        }

        // Go through the list of all orders and display them in organised cards.
        container.innerHTML = orders.map(order => `
            <div class="order-card" style="background: #fff; border: 1px solid #d2d2d7; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <span style="color: #86868b; font-size: 12px; text-transform: uppercase;">Order Number</span>
                        <p style="font-weight: 600;">${order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: #86868b; font-size: 12px; text-transform: uppercase;">Date Placed</span>
                        <p>${new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.productIds.map(item => `
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                            <span>${item.name}</span>
                            <span>$${item.price}</span>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f5f5f7; display: flex; justify-content: space-between;">
                    <strong>Total</strong>
                    <strong>$${order.totalPrice}</strong>
                </div>
            </div>
        `).join('');

    } catch (err) {
        container.innerHTML = "<p>Unable to load order History.</p>";
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Load current bag items
    displayCart();
    // Load permanent history
    displayOrderHistory();
});

// Call this when page loads
displayOrderHistory();
displayCart();

