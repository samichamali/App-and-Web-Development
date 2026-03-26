document.getElementById('registerForm').onsubmit = async (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    // 1. Basic validation
    if (password !== confirm) {
        alert("The Passwords inputted don't match!");
        return;
    }

    try {
        // 2. Send to your Dockerized Backend
        const response = await fetch('api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Account created! Please Sign In!");
            window.location.href = 'login.html';
        } else {
            alert(data.message || "Email Already Exists!");
        }
    } catch (err) {
        console.error("Registration error:", err);
        alert("Server is down. Check your Docker container.");
    }
};