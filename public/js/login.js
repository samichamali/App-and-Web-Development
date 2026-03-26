document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // if the login was successful save their token id and then send directly to the store page.
            localStorage.setItem('token', data.token);
            window.location.href = 'store.html';
        } else {
            alert(data.message || "Invalid credentials.");
        }
    } catch (err) {
        console.error("Error with logging in:", err);
    }
};