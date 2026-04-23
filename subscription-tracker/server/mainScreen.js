const signUpOverlay = document.getElementById('background');
const signInOverlay = document.getElementById('background2');
const signUpForm = document.getElementById('signupForm');
const signInForm = document.getElementById('signinForm');
const authStatus = document.getElementById('authStatus');

function setStatus(message, isError = false) {
    authStatus.textContent = message;
    authStatus.style.color = isError ? '#b00020' : '#1e6b52';
}

document.getElementsByClassName('signUpBox')[0].addEventListener('click', function () {
    signUpOverlay.style.display = 'flex';
});

document.getElementsByClassName('close')[0].addEventListener('click', function () {
    signUpOverlay.style.display = 'none';
});

document.getElementsByClassName('signInBox')[0].addEventListener('click', function () {
    signInOverlay.style.display = 'flex';
});

document.getElementsByClassName('close2')[0].addEventListener('click', function () {
    signInOverlay.style.display = 'none';
});

signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
        username: document.getElementById('fname').value,
        password: document.getElementById('fpass').value,
        email: document.getElementById('femail').value,
    };

    const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        setStatus(data.error || 'Could not create account.', true);
        return;
    }

    setStatus(`Welcome, ${data.username}! Your account was created.`);
    signUpForm.reset();
    signUpOverlay.style.display = 'none';
});

signInForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
        username: document.getElementById('loginUsername').value,
        password: document.getElementById('loginPassword').value,
    };

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        setStatus(data.error || 'Could not sign in.', true);
        return;
    }

    setStatus(`Signed in as ${data.username}. You can now save subscriptions.`);
    signInForm.reset();
    signInOverlay.style.display = 'none';
});

(async function loadUser() {
    const response = await fetch('/api/me');
    const data = await response.json();
    if (data.authenticated) {
        setStatus(`Signed in as ${data.user.username}.`);
    } else {
        setStatus('Create an account or sign in to store subscriptions in MongoDB.');
    }
})();
