import { getUser } from "./utils.js";

// Global variables
var username = getUser();
var previousData = [];
var playerInfo = {};
var playerBets = {};
const boxes = {
    bets: document.getElementById("bets"),
    transactions: document.getElementById("transactions"),
    tickets: document.getElementById("tickets")
};
const alphanumericRegex = /^[a-zA-Z0-9]+$/;

document.getElementById('player_save_infos').addEventListener('click', saveInfos);
document.getElementById('player_save_password').addEventListener('click', savePassword);

//Methods to do at begining
fetchPlayerInfo()
    .then(() => {
        fetchAllData();
    })
    .catch(error => {
        console.error("Error fetching player info:", error);
    });

async function fetchPlayerInfo() {
    return fetch('/api/admin/getPlayerInfo', {
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
            const balanceEl = document.getElementById("balance");
            balanceEl.innerHTML = data.results.balance;
            playerInfo = data.results;
            updateInfos();
        })
        .catch(error => {
            console.error('Error during POST:', error);
        })
}

function updateInfos() {
    document.getElementById("username").value = playerInfo.username;
    document.getElementById("email").value = playerInfo.email;
}

async function saveInfos() {
    const email = document.getElementById("email").value;
    var result = await emailIsValid(email);
    const warningEl = document.getElementById("infos_warning");

    if (result.valid || email == playerInfo.email) {
        warningEl.style.display = 'none';
    } else {
        warningEl.innerHTML = result.error;
        warningEl.style.display = 'block';
        return;
    }
    const username = document.getElementById("username").value;
    result = await usernameIsValid(username);

    if (result.valid || username == playerInfo.username) {
        warningEl.style.display = 'none';
    } else {
        warningEl.innerHTML = result.error;
        warningEl.style.display = 'block';
        return;
    }
    //If here, username and email are valid
    if (username == playerInfo.username && email == playerInfo.email) { return; }

    data = {
        username: playerInfo.username,
        newUsername: username,
        email,
        password: playerInfo.password,
        balance: playerInfo.balance
    };
    fetch('/api/admin/updatePlayer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error executing query:', error);
        });
    playerInfo.username = username;
    playerInfo.email = email;
}

async function usernameIsValid(username) {
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

async function emailIsValid(email) {
    const emailRegex = /^(?!.*\$)\S+@\S+\.\S+$/;
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

async function savePassword() {
    const warningEl = document.getElementById("password_warning");
    const inputPassword = document.getElementById("password").value;
    if (inputPassword == playerInfo.password) {
        warningEl.style.display = 'none';
    } else {
        warningEl.innerHTML = "Ce n'est pas le bon mot de passe";
        warningEl.style.display = 'block';
        return;
    }

    const newPassword = document.getElementById("new_password").value;
    const result = await passwordIsValid(newPassword);
    if (!result.valid) {
        warningEl.innerHTML = result.error;
        warningEl.style.display = 'block';
        return;
    }

    const confirmNewPassword = document.getElementById("confirm_new_password").value;
    if (newPassword !== confirmNewPassword) {
        warningEl.innerHTML = 'Le nouveau mot de passe et la confirmation sont différents';
        warningEl.style.display = 'block';
        return;
    }

    //If here, username and email are valid
    if (newPassword == inputPassword) { return; }

    data = {
        username: playerInfo.username,
        newUsername: playerInfo.username,
        email: playerInfo.email,
        password: newPassword,
        balance: playerInfo.balance
    };
    fetch('/api/admin/updatePlayer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error executing query:', error);
        });
    playerInfo.password = newPassword;

}

async function passwordIsValid(password) {
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

function fetchAllData() {
    const collections = [
        {
            name: 'bets',
            projection: { projection: { _id: 0, game: 1, dateTime: 1, amount: 1, payout: 1 } },
            headers: ['Jeu', 'Date', 'Montant parié', 'Montant gagné']
        }
    ];
    collections.forEach(collection => {
        fetchTableData(collection);
    });
}

function fetchTableData(collection) {
    const username = playerInfo.username;
    const data = {
        collection: collection.name,
        query: { username },
        options: collection.projection
    };
    fetch('/api/admin/customQuery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            updateBox(collection, data.results);
        })
        .catch(error => {
            console.error('Error executing query:', error);
        });
}

function updateBox(collection, data) {

    const box = boxes[collection.name];
    if (data.length === 0) {
        box.innerHTML += "<label>Aucune donnée disponible</label>";
        return;
    }

    var table = document.createElement('table');
    const headerRow = table.insertRow();
    collection.headers.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    for(let i = 0; i < data.length; i++){
        const row = table.insertRow();
        Object.entries(data[i]).forEach(([key, value]) => {
            const cell = row.insertCell();
            if (key.toLowerCase() === 'gameid' && boxId === 'paris') {
                cell.textContent = getGameName(value);
            } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                cell.textContent = new Date(value).toLocaleString();
            } else {
                cell.textContent = value;
            }
        });
    }

    box.appendChild(table);
}
