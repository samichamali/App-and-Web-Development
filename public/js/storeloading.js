let allProducts = [];
const productContainer = document.getElementById('product-container');
const searchInput = document.getElementById('productSearch');
const modal = document.getElementById("productModal");
const btn = document.getElementById("openModalBtn");
const span = document.querySelector(".close-btn");
const form = document.getElementById("addProductForm");

// This functions renders all the products on the page after receiving a list of them.
function renderProducts(productsToDisplay) {
    productContainer.innerHTML = ''; // clear the current page to avoid redundancy.

    if (productsToDisplay.length === 0) {
        productContainer.innerHTML = `
            <div style="text-align:center; width:100%; color:#86868b; margin-top:50px; grid-column: 1 / -1;">
                <p>No Relevant Products have been Found.</p>
            </div>`;
        return;
    }

    productsToDisplay.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h1 class="product-title">${product.name}</h1>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span class="price">$${product.price}</span>
                    <button class="buy-btn" onclick="addToCart('${product._id}')">Buy</button>
                </div>
            </div>
        `;
        productContainer.appendChild(card);
    });
}

// Here we fetch all the prodcuts in the store and display on the list.
async function fetchAndInitStore() {
    try {
        productContainer.innerHTML = '<p>Loading the latest Apple gear...</p>';
        const response = await fetch('/api/products'); // Use relative path for Docker Port 80
        allProducts = await response.json();
        renderProducts(allProducts); // After obtaining the list of products, we render them on the page for the user to see.
    } catch (error) {
        console.error("Failed to load products:", error);
        productContainer.innerHTML = '<p>Error connecting to server. Is Docker running?</p>';
    }
}


// This Search box listens to every key press and filters the list based on what has been written.
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();

        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            (p.category && p.category.toLowerCase().includes(term))
        );

        renderProducts(filtered);
    });
}

// This function adds items to cart by saving the selected products to LocalStorage.
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('appleCart')) || [];
    cart.push(productId);
    localStorage.setItem('appleCart', JSON.stringify(cart));
    updateCartCount();
}

//
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('appleCart')) || [];
    const countElement = document.getElementById('cart-count');
    if (countElement) countElement.innerText = cart.length;
}

// This allows us to input and add out own products.
if (btn) btn.onclick = () => modal.style.display = "block";
if (span) span.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/addproduct', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert("Product added successfully!");
                modal.style.display = "none";
                form.reset();
                // Refresh the global list and UI
                fetchAndInitStore();
            } else {
                alert("Upload failed.");
            }
        } catch (err) {
            console.error("Error:", err);
        }
    };
}

// Intialising
document.addEventListener('DOMContentLoaded', () => {
    fetchAndInitStore();
    updateCartCount();
});