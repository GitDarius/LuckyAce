//Makes code wait a certain amount of times before next line
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function customParseFloat(value) {
    return parseFloat(value.replaceAll(",", ""));
}

export function betIsValidNumber(playerBalance) {
    let bet = getBet();
    return (!isNaN(bet) && bet > 0.009 && bet <= playerBalance);
}

export function getBet() {
    return customParseFloat(document.getElementById("bet_amount").value).toFixed(2);
}

export function clamp(min, max, value) {
    if (min != -1 && value <= min) {
        return min;
    } else if (max != -1 && value >= max) {
        return max;
    }
    return value;
}

export function saveBalance(playerBalance, username) {
    fetch('/api/updateBalance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newBalance: playerBalance, username: username })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error during POST:', error);
        })

}

export function getUser() {
    //Check if there's a connected user.
    //If yes, continue, if no. Redirect to main page or sign up page
    //The following codes assumes we got a cookie and the username is player1
    //Note, when fetch added, return the fetch
    return 'player1';
}

export async function getPlayerBalance(username) {
    return fetch('/api/getBalance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username })
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.length == 0) {
                console.log("No players found with this username");
                return;
            }
            return data.balance;
        })
        .catch(error => {
            console.error('Error during POST:', error);
        })
}

export async function showSuccess() {

    const card = document.createElement('div');

    //All the style added in js because I dont want to make a whole new css file for that
    card.style.position = 'fixed';
    card.style.top = '50%';
    card.style.left = '50%';
    card.style.transform = 'translate(-50%, -50%)';
    card.style.width = '300px';
    card.style.height = '400px';
    card.style.perspective = '1000px';
    card.style.zIndex = '1000';

    //Contains the card front and back
    const cardInner = document.createElement('div');
    cardInner.style.width = '100%';
    cardInner.style.height = '100%';
    cardInner.style.position = 'relative';
    cardInner.style.transformStyle = 'preserve-3d';
    cardInner.style.transition = 'transform 0.6s ease';

    //The back (first thing we see)
    const cardBack = document.createElement('img');
    cardBack.src = '/images/Cartes/Dos.png';
    cardBack.style.position = 'absolute';
    cardBack.style.width = '100%';
    cardBack.style.height = '100%';
    cardBack.style.backfaceVisibility = 'hidden';

    //The front (last thing we see)
    const cardFront = document.createElement('img');
    cardFront.src = '/images/Cartes/carte_succes.png';
    cardFront.style.position = 'absolute';
    cardFront.style.width = '100%';
    cardFront.style.height = '100%';
    cardFront.style.transform = 'rotateY(180deg)'; //Initially rotated and hidden
    cardFront.style.backfaceVisibility = 'hidden'; //Makes it hidden when rotated


    cardInner.appendChild(cardBack);
    cardInner.appendChild(cardFront);

    card.appendChild(cardInner);

    document.body.appendChild(card);


    setTimeout(() => {
        cardInner.style.transform = 'rotateY(180deg)';
    }, 200);

    setTimeout(() => {
        if (document.body.contains(card)) {
            document.body.removeChild(card);
        }
    }, 2200);
}

export function loi96(mot){
    mot = mot.toLowerCase();
    const dictionnaire = {
        '_id' : 'Identifiant',
        'username' : "Nom d'utilisateur",
        'email' : 'Email',
        'password' : 'Mot de passe',
        'balance' : 'Solde',
        'datetime' : 'Date',
        'game' : 'Jeu',
        'amount' : 'Montant parié', //À revoir si possible. Sinon, c'est pas grave
        'payout' : 'Montant gagné',
        'details' : 'Details',
        'direction' : 'Direction',
        'text' : 'Texte',
        'category' : 'Catégorie',
        'status' : 'Statut'
    }

    if(dictionnaire[mot] == undefined){
        console.log(`${mot} pas trouvé`)
        return '';
    }
    return dictionnaire[mot];
}
