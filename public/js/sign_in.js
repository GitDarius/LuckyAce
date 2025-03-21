const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const warning = document.getElementById("warning");

usernameField.addEventListener('input', () => {
    warning.style.display = "none";
})
passwordField.addEventListener('input', () => {
    warning.style.display = "none";
})

function verifyInfos() {
    if (formValid()) {

        var enteredUsername = usernameField.value;
        var enteredPassword = passwordField.value;

        fetch('/api/sign_in/getPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usernameEmail: enteredUsername })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    if (data.password == enteredPassword) {
                        //Create cookie with username
                        console.log("nom d'utilisateur et mot de passe corrects !");
                        window.location.replace("/");
                    } else {
                        warning.style.display = "block";
                    }
                }else {
                    warning.style.display = "block";
                }
            })
            .catch(error => {
                console.error('Error executing query:', error);
            });
    }
}


function formValid() {
    const username = usernameField.value != '';
    const password = passwordField.value != '';
    if(!(username && password)){warning.style.display = "block";}
    return username && password;
}