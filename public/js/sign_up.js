import { showSuccess, sleep } from "./utils.js";

const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const confirmPasswordField = document.getElementById("confirm-password");
const emailField = document.getElementById("email");
const checkbox = document.getElementById("terms");

const alphanumericRegex = /^[a-zA-Z0-9]+$/;

document.getElementById('create_account').addEventListener('click', formValid);

async function createPlayer() {
    const enteredUsername = usernameField.value;
    const enteredPassword = passwordField.value;
    const enteredEmail = emailField.value;

    const dataset = {
        username: enteredUsername,
        email: enteredEmail,
        password: enteredPassword,
        balance: 50
    };
    fetch('/api/sign_up/createPlayer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dataset })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                successGoHome();
            }
            else {
                warnEl = document.getElementById("warning_username");
                warnEl.innerHTML = "Erreur lors de la creation du compte";
                warnEl.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error executing query:', error);
        });
}

async function successGoHome(){
    showSuccess();
    await sleep(2200)
    //Ajouter cookie avec le nom d'utilisateur!
    window.location.replace("/");
}

async function formValid() {
    const usernameValid = (await usernameIsValid()).valid;
    const emailValid = (await emailIsValid()).valid;
    const passwordValid = (await passwordIsValid()).valid;
    const samePassword = (await passwordsIdentical()).valid;
    const termsCheck = (await termsChecked()).valid;
    if (usernameValid && emailValid && passwordValid && samePassword && termsCheck) {
        createPlayer();
    } else {
        dynamicValidation();
        verifyWarning("username_warning", usernameIsValid);
        verifyWarning("password_warning", passwordIsValid);
        verifyWarning("confirm_password_warning", passwordsIdentical);
        verifyWarning("email_warning", emailIsValid);
        verifyWarning("terms_warning", termsChecked);
    }
}

function dynamicValidation() {
    usernameField.addEventListener('input', () => {
        verifyWarning("username_warning", usernameIsValid);
    });
    passwordField.addEventListener('input', () => {
        verifyWarning("password_warning", passwordIsValid);
    });
    confirmPasswordField.addEventListener('input', () => {
        verifyWarning("confirm_password_warning", passwordsIdentical);
    });
    emailField.addEventListener('input', () => {
        verifyWarning("email_warning", emailIsValid);
    });
    checkbox.addEventListener('input', () => {
        verifyWarning("terms_warning", termsChecked);
    });
}

async function verifyWarning(warningId, validationMethod) {
    const warnEl = document.getElementById(warningId);
    const result = await validationMethod();
    if (result.valid) {
        warnEl.style.display = 'none';
    } else {
        warnEl.innerHTML = result.error;
        warnEl.style.display = 'block';
    }
}

async function usernameIsValid() {
    const username = usernameField.value;
    if (username === '') {
        return { valid: false, error: "Case vide" }
    }

    if (!alphanumericRegex.test(username)) {
        return { valid: false, error: "Seulement lettres et chiffres acceptés" }
    }

    return fetch('/api/usernameExists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.exists) {
                return { valid: false, error: "nom d'utilisateur existe déjà" }
            } else {
                return { valid: true }
            }
        })
        .catch(error => {
            console.error('Error during POST:', error);
        })

}

async function emailIsValid() {
    const emailRegex = /^(?!.*\$)\S+@\S+\.\S+$/;
    const email = emailField.value;
    if (email === '') {
        return { valid: false, error: "Case vide" }
    }

    if (!emailRegex.test(email)) {
        return { valid: false, error: "Format de l'email invalide" }
    }

    return fetch('/api/emailExists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.exists) {
                return { valid: false, error: "L'email est utilisé par un autre compte" }
            } else {
                return { valid: true }
            }
        })
        .catch(error => {
            console.error('Error during POST:', error);
        })
}

async function passwordIsValid() {
    const password = passwordField.value;

    if (password === '') {
        return { valid: false, error: "Case vide" }
    }

    if (password.length < 8) {
        return { valid: false, error: "Trop court. Minimum 8 caractères" }
    }
    if (password.length > 15) {
        return { valid: false, error: "Trop long. Max 15 charactères" }
    }

    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const digitRegex = /[0-9]/;

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

    if (!uppercaseRegex.test(password)) {
        return { valid: false, error: "Doit contenir au moins une lettre majuscule" }
    }
    if (!lowercaseRegex.test(password)) {
        return { valid: false, error: "Doit contenir au moins une lettre minuscule" }
    }
    if (!digitRegex.test(password)) {
        return { valid: false, error: "Doit contenir au moins un chiffre" }
    }
    if (!specialCharRegex.test(password)) {
        return { valid: false, error: "Doit contenir au moins un caractère spécial" }
    }

    const allowedCharsRegex = /^[A-Za-z0-9!@#$%^&*(),.?":{}|<>]+$/;
    const nonAllowedChars = [];
    for (let i = 0; i < password.length; i++) {
        if (!allowedCharsRegex.test(password.charAt(i))) {
            nonAllowedChars.push(password.charAt(i))
        }
    }
    if (nonAllowedChars.length > 0) {
        return { valid: false, error: `Caractères non autorisés ${nonAllowedChars.join(", ")}` }
    }

    return { valid: true }
}

async function passwordsIdentical() {
    const confPassword = confirmPasswordField.value;

    if (confPassword === '') {
        return { valid: false, error: "Case vide" }
    }

    if (passwordField.value !== confPassword) {
        return { valid: false, error: "Mots de passe différents" }
    }
    return { valid: true }
}

async function termsChecked() {
    if (!checkbox.checked) {
        return { valid: false, error: "Termes et conditions pas cochés" }
    }
    return { valid: true }
}