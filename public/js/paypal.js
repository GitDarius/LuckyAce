import { getUser, getPlayerBalance, customParseFloat, saveBalance, showSuccess } from './utils.js'

//Variables
var username = await getUser();
var playerBalance = await getPlayerBalance(username);
var isDeposit = true;

addBalance(0);

//Elements
document.getElementById('close_wallet').addEventListener('click', closeWallet);
document.getElementById('credit_card').addEventListener('click', showWallet);
const doTransactionBut = document.getElementById('wallet_start_transaction');
const walletEl = document.getElementById("wallet");
const amountInpEl = document.getElementById('wallet_transfer_amount');
const depositEl = document.getElementById('wallet_deposit');
const transferEl = document.getElementById('wallet_transfer');
const errorEl = document.getElementById('wallet_error');
const emailLabel = document.getElementById('wallet_transfer_email_label');
const emailInpEl = document.getElementById('wallet_transfer_email');


depositEl.addEventListener('click', selectDeposit);
transferEl.addEventListener('click', selectTransfer);
doTransactionBut.addEventListener('click', doTransaction);

function showWallet() {
    walletEl.style.display = 'block';
}

function closeWallet() {
    walletEl.style.display = 'none';
}

function walletAmountValid() {
    var inputValue = amountInpEl.value;
    if (inputValue == '') {
        showError("Montant non saisi");
        return false;
    } else {
        hideError();
    }

    inputValue = customParseFloat(inputValue);
    if (isNaN(inputValue)) {
        showError("le montant saisi n'est pas un nombre");
        return false;
    }

    if (!isDeposit) {
        if (inputValue > playerBalance) {
            showError("Vous n'avez pas les fonds pour le transfert");
            return false;
        }
    }

    return true;
}

async function doTransaction() {
    //The code is really big, so I'll comment it each step.
    //Not allow spam
    doTransactionBut.disabled = true;
    if (walletAmountValid()) {
        //We know it's safe, so we parse it
        const amount = customParseFloat(amountInpEl.value);
        if (isDeposit) {
            try {
                const response = await fetch('/create-purchase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ amount })
                });
                if (!response.ok) {
                    throw new Error(`Error! Status: ${response.status}`);
                }
                const orderData = await response.json();
                
                //Link by Paypal with everything ready to guide the user. The ammount, the connection form etc.
                const approvalLink = orderData.links.find(link => link.rel === 'approve');
                if (!approvalLink) {
                    console.error('Approval link not found');
                    doTransactionBut.disabled = false;
                    return;
                }

                //Opens the link in a pop up. We could also open it in the chrome, but I dont like it
                const popup = window.open(approvalLink.href, 'paypalPopup', 'width=600,height=600,scrollbars=yes');

                //Each second, checks if the pop up closed (infinite loop)
                const pollTimer = window.setInterval(async function () {
                    if (popup.closed) {
                        //Gets out of the infinite loop
                        window.clearInterval(pollTimer);
                        try {
                            //Once the user finished it's work with paypal, we go ask paypal how it went
                            const captureResponse = await fetch('/capture-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderID: orderData.id })
                            });
                            if (!captureResponse.ok) {
                                throw new Error(`Error capturing order: ${captureResponse.status}`);
                            }
                            showSuccess();
                            createDeposit('', amount);
                            addBalance(amount);
                        } catch (err) {
                            console.error('Error capturing order:', err);
                            showError("Erreur durant la capture de la commande");
                        }
                        doTransactionBut.disabled = false;
                    }
                }, 1000);
            } catch (error) {
                console.error('Error creating purchase:', error);
                showError("Erreur durant le processus");
                doTransactionBut.disabled = false;
            }
        } else {
            //First we check if the email is in a valid format
            const emailRegex = /^(?!.*\$)\S+@\S+\.\S+$/;
            const email = emailInpEl.value;
            if (email === '') {
                showError("email vide");
                return;
            }

            if (!emailRegex.test(email)) {
                showError("Format de l'email invalide");
                return;
            }

            //Way easier than make the client pay. But it takes some time to update in the user's page
            try {
                const response = await fetch('/payout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, amount })
                });

                if (!response.ok) {
                    showError("Erreur lors de l'opération");
                    throw new Error(`Error! Status: ${response.status}`);
                }
                doTransactionBut.disabled = false;
                showSuccess();
                createDeposit(email, amount);
                addBalance(-amount);
                const data = await response.json();
                return data;
            } catch (error) {
                showError("Erreur lors de l'opération");
                console.error('Error processing payout:', error);
                return null;
            }
        }
    }
    doTransactionBut.disabled = false;
}

function createDeposit(email, amount){
    const direction = isDeposit ? 'deposit' : 'transfer';
    fetch('/api/createDeposit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, amount, direction})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if(data.success){
            console.log("Deposit saved!")
        }else{
            console.log("Error saving the deposit");
        }
    })
    .catch(error => {
        console.error('Error executing query:', error);
    });
}

function showError(message) {
    errorEl.innerHTML = message;
    errorEl.style.display = 'block';
}

function addBalance(balanceIncrease) {
    playerBalance += balanceIncrease;
    const balanceEl = document.getElementById("balance");
    balanceEl.innerHTML = playerBalance;
    if (balanceIncrease != 0) {
        saveBalance(playerBalance, username);
    }
}

function hideError() {
    errorEl.innerHTML = '';
    errorEl.style.display = 'none';
}

function selectDeposit() {
    isDeposit = true;
    depositEl.classList = ['wallet-direction wallet-direction-choice'];
    transferEl.classList = ['wallet-direction'];
    emailLabel.style.display = 'none';
    emailInpEl.style.display = 'none';
}

function selectTransfer() {
    isDeposit = false;
    depositEl.classList = ['wallet-direction'];
    transferEl.classList = ['wallet-direction wallet-direction-choice'];
    emailLabel.style.display = 'block';
    emailInpEl.style.display = 'block';
}