import { sleep, saveBalance, betIsValidNumber, getBet, getUser, getPlayerBalance } from './utils.js';

class Hand {
    /**
     * Creates a new Hand (the thing that contains the cards)
     * @param {elementID} - The DOM element ID
     * @param {sumID} - The DOM ID of the hands sum div
     * @param {Card[]} [cardList=[]] - Contains the cards
     * @param {betAmount} - Amount of cash on the hand
     */
    constructor(elementID, sumID, betAmount, cardList = []) {
        this.sumID = sumID;
        this.elementID = elementID;
        this.betAmount = betAmount;
        this.cardList = cardList;
    }

    addCard(card) {
        this.cardList.push(card);
    }

    stringValue() {
        let aces = [];
        let sum = 0;

        this.cardList.forEach(card => {
            if (card.cardName.startsWith("A")) {
                aces.push(card);
            } else {
                let number = card.cardName[0];
                if (["J", "Q", "K", "X"].includes(number)) {
                    sum += 10;
                } else {
                    sum += parseInt(number);
                }
            }
        });

        if (aces.length == 0) {
            return sum.toString();
        }

        if (this.cardList.length == 2 && sum == 10) {
            return "21";
        }

        var bigAce = false;
        aces.forEach(() => {
            if (sum + 11 + aces.length - 1 > 21) {
                sum += 1;
            } else {
                bigAce = true;
                sum += 11;
            }
        });

        if (bigAce) {
            return '(' + (sum - 10) + ') ' + sum;
        } else {
            return sum + "";
        }
    }

    intValue() {
        const stringVal = this.stringValue();
        if (stringVal.length < 3) {
            return parseFloat(stringVal);
        } else {
            const extractedString = stringVal[stringVal.length - 2] + stringVal[stringVal.length - 1];
            return parseFloat(extractedString);
        }
    }

    canSplit() {
        if (this.cardList.length === 2) {
            const firstNumber = this.cardList[0].cardName[0];
            const secondNumber = this.cardList[1].cardName[0];
            return firstNumber == secondNumber;
        }
        return false;
    }
}

class Card {
    /**
     * Creates a Card.
     * @param {string} element - The DOM element.
     * @param {string} cardName - The name of the card's png.
     */
    constructor(element, cardName) {
        this.element = element;
        this.cardName = cardName;
    }
}

//Beginning of global variables
var username = await getUser();
//Reduce code duplication and increase clarity
const elementsDict = {
    hit: document.getElementById("button_hit"),
    rest: document.getElementById("button_rest"),
    double: document.getElementById("button_double"),
    split: document.getElementById("button_split"),
    startGame: document.getElementById("button_start_game"),
    bottom_pamel: document.getElementById("bottom_panel"),
}
//Change
var descGame = [];

var deck = [];
/*
0 = Bank
1 = Player's base hand
2+ = Player's split hand
 */
var hands = [];

var payoutTotal = 0;
var actualHandIndex = 1;
var startingBet = 0;
var playerBalance = await getPlayerBalance(username);
//End of global variables

//Assign buttons commands
document.getElementById('button_start_game').addEventListener('click', startGame);
document.getElementById('button_hit').addEventListener('click', hit);
document.getElementById('button_rest').addEventListener('click', nextHand);
document.getElementById('button_double').addEventListener('click', double);
document.getElementById('button_split').addEventListener('click', newHand);
//End of assigns

//Commands to do at the beggining of the round
createCards();
elementsDict.hit.disabled = true;
elementsDict.rest.disabled = true;
elementsDict.double.disabled = true;
elementsDict.split.disabled = true;
document.getElementById("bet_amount").addEventListener("input", function (e) {
    var value = document.getElementById("bet_amount").value;
    const warningElement = document.getElementById("input_warning_message");
    if (value.length == 0) {
        warningElement.style.display = "none";
    } else if (isNaN(parseFloat(value))) {
        warningElement.innerHTML = 'Veuillez saisir un nombre!';
        warningElement.style.display = "block";
        return;
    }
    value = parseFloat(value)
    if (value <= 0.009 && value != 0) {
        warningElement.innerHTML = 'Au moins 0.01$';
        warningElement.style.display = "block";
    } else if (value > playerBalance) {
        warningElement.innerHTML = 'Vous n\'avez pas l\'argent';
        warningElement.style.display = "block";
    } else {
        warningElement.style.display = "none";
    }
});
//End of commands

function createCards(deckAmount = 1) {
    var numbers = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "X", "J", "Q", "K"];
    var symbols = ["Coeur", "Pique", "Carreau", "Trefle"];
    for (var _ = 0; _ < deckAmount; _++) {
        for (var i = 0; i < numbers.length; i++) {
            for (var j = 0; j < symbols.length; j++) {
                deck.push(numbers[i] + "_" + symbols[j]);
            }
        }
    }
    shuffle(deck);
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

function flipCard(cardElement) {
    // Get the .card-inner element within the clicked card
    const cardInner = cardElement.querySelector('.card-inner');

    // Add the "flipped" class so that it stays flipped
    cardInner.classList.add('flipped');
}

function spawnCard(cardName) {
    const card = document.createElement('div');
    card.classList.add('moving-card');

    const cardInner = document.createElement('div');
    cardInner.classList.add('card-inner');

    const cardBack = document.createElement('img');
    cardBack.src = '/images/Cartes/' + cardName + '.png';
    cardBack.classList.add('card-back');

    const cardFront = document.createElement('img');
    cardFront.src = '/images/Cartes/Dos.png';
    cardFront.classList.add('card-front');

    cardInner.appendChild(cardBack);
    cardInner.appendChild(cardFront);
    card.appendChild(cardInner);

    const cardDeck = document.getElementById('cards_deck');
    const containerRect = cardDeck.getBoundingClientRect();

    cardDeck.appendChild(card);

    return card;
}

function moveObjectDestination(object, destination, flipCardx, noClassAdd = false) {
    const objectRect = object.getBoundingClientRect();
    const destinationRect = destination.getBoundingClientRect();

    const distanceX = destinationRect.left - objectRect.left + destinationRect.width / 2 - objectRect.width / 2;
    const distanceY = destinationRect.top - objectRect.top + destinationRect.height / 2 - objectRect.height / 2;

    object.style.transform = `translate(${distanceX}px, ${distanceY}px)`;

    if (flipCardx) {
        setTimeout(() => {
            flipCard(object);
        }, 400);
    }

    setTimeout(() => {
        destination.appendChild(object);
        object.style.transform = '';
        object.classList.remove('moving-card')
        object.classList.add('card');
        if (actualHandIndex != 0 && hands.length > 2 && !noClassAdd) { object.classList.add('actual-hand'); }
    }, 750);
}

async function takeCard(flipCard = true, updateTotalx = true) {
    elementsDict.hit.disabled = true;

    const newCardName = deck.pop();
    if (deck.length == 0) { createCards() }
    const card = spawnCard(newCardName);
    hands[actualHandIndex].cardList.push(new Card(card, newCardName));
    const destination = document.getElementById(hands[actualHandIndex].elementID);
    descGame.push(newCardName + ";");
    moveObjectDestination(card, destination, flipCard);
    if (updateTotalx) {
        updateTotal();
    }
    if (actualHandIndex != 0 && hands[actualHandIndex].intValue() == 21 && hands[actualHandIndex].cardList.length == 2) {
        addBalance(hands[1].betAmount * 2.5);
    }
}

function updateTotal(index = actualHandIndex) {
    document.getElementById(hands[index].sumID).innerHTML = 'Total: ' + hands[actualHandIndex].stringValue();
}

async function newHand() {
    descGame.push(actualHandIndex + "-Divise;");
    elementsDict.hit.disabled = true;
    elementsDict.double.disabled = true;
    elementsDict.split.disabled = true;
    elementsDict.rest.disabled = true;
    const hand = document.createElement('div');
    hand.classList.add('card-holder')
    hand.id = "cards_player_" + hands.length;
    const sum = document.createElement('div');
    sum.classList.add('somme');
    sum.id = "sum_player_" + hands.length;
    sum.innerHTML = 'Total: 0';

    hand.appendChild(sum);
    const movingCard = hands[actualHandIndex].cardList.pop();
    while (movingCard.element.classList.length > 1) {
        movingCard.element.classList.remove(movingCard.element.classList.item(movingCard.element.classList.length - 1));
    }
    const newHand = new Hand(hand.id, sum.id, startingBet);
    newHand.addCard(movingCard);
    hands.push(newHand);
    elementsDict.bottom_pamel.appendChild(hand);
    addBalance(-startingBet);
    moveObjectDestination(movingCard.element, hand, false, true);
    await sleep(500);
    updateTotal(hands.length - 1)
    updateTotal();
    await sleep(500);
    setPlayerElClass("actual-hand");
    elementsDict.rest.disabled = false;
    elementsDict.hit.disabled = false;
    if (playerBalance > hands[actualHandIndex].betAmount) {
        elementsDict.double.disabled = false;
    }
    if (hands[actualHandIndex].canSplit() && canDouble(actualHandIndex)) {
        elementsDict.split.disabled = false;
    }
}

async function startGame() {
    if (!betIsValidNumber(playerBalance)) { return; }
    elementsDict.startGame.disabled = true;
    startingBet = getBet();
    addBalance(-startingBet);
    if (hands.length != 0) {
        resetGame();
    }
    hands.push(new Hand("cards_bank", "sum_bank"));
    hands.push(new Hand("cards_player_1", "sum_player_1", startingBet));
    updateTotal(0);
    updateTotal(1);
    descGame.push(actualHandIndex + "-Pige-");
    takeCard();
    actualHandIndex = 0;
    await sleep(500);
    descGame.push(actualHandIndex + "-Pige-");
    takeCard();
    actualHandIndex = 1;
    await sleep(500);
    descGame.push(actualHandIndex + "-Pige-");
    takeCard();
    actualHandIndex = 0;
    await sleep(500);
    descGame.push(actualHandIndex + "-Pige-");
    takeCard(false, false);
    actualHandIndex = 1;
    await sleep(1000);

    if (hands[1].stringValue() == 21) {
        nextHand();
        return;
    } else if (hands[0].stringValue() == 21) {
        //The bank can't split so we can handle it's blackjack here
        flipCard(hands[0].cardList[0].element);
        flipCard(hands[0].cardList[1].element);
        document.getElementById(hands[0].sumID).innerHTML = 'Total: 21';
        setPlayerElClass("loser");
        softReset();
        return;
    } else if (hands[1].canSplit() && canDouble(1)) {
        elementsDict.split.disabled = false;
    }
    if (canDouble(1)) {
        elementsDict.double.disabled = false;
    }
    elementsDict.rest.disabled = false;
    elementsDict.hit.disabled = false;
}

function canDouble(index) {
    return playerBalance > hands[index].betAmount;
}

function setPlayerElClass(newClass) {
    const cardsElement = document.getElementById(hands[actualHandIndex].elementID);
    var children = cardsElement.children;
    for (var i = 0; i < children.length; i++) {
        children[i].classList.add(newClass);
    }
}

function addBalance(balanceIncrease) {
    playerBalance += balanceIncrease;
    const balanceEl = document.getElementById("balance");
    balanceEl.innerHTML = playerBalance;
    if (balanceIncrease > 0) {
        payoutTotal += balanceIncrease;
    }
    if (balanceIncrease != 0) {
        saveBalance(playerBalance, username);
    }
}

function resetGame() {
    //Erase all player hands
    const botPanel = document.getElementById("bottom_panel");
    //Skip original hand
    while (botPanel.children.length > 1) {
        botPanel.removeChild(botPanel.lastChild);
    }

    //Security measure
    if (botPanel.children.length > 0) {
        //Removes all the cards from original hand while keeping the sum (first child)
        while (botPanel.children[0].children.length > 1) {
            botPanel.children[0].removeChild(botPanel.children[0].lastChild);
        }
    }

    //Removes all cards form bank
    const bankCards = document.getElementById(hands[0].elementID);
    while (bankCards.children.length > 1) {
        bankCards.removeChild(bankCards.lastChild);
    }
    //Removes the additional classes like "winner" and "loser"
    //Also resets the value
    const playerSumEl = document.getElementById(hands[1].sumID);
    playerSumEl.innerHTML = "Total: 0";
    while (playerSumEl.classList.length > 1) {
        playerSumEl.classList.remove(playerSumEl.classList.item(playerSumEl.classList.length - 1));
    }

    deck = [];
    hands = [];

    actualHandIndex = 1;

    createCards();
    elementsDict.hit.disabled = true;
    elementsDict.rest.disabled = true;
    elementsDict.double.disabled = true;
    elementsDict.split.disabled = true;
}

//Resets the hidden values
function softReset() {
    elementsDict.hit.disabled = true;
    elementsDict.double.disabled = true;
    elementsDict.split.disabled = true;
    elementsDict.rest.disabled = true;
    elementsDict.startGame.disabled = false;
    playerBalance = parseFloat(document.getElementById("balance").innerHTML);
    save();
    descGame = [];
    payoutTotal = 0;
}

async function hit() {
    elementsDict.hit.disabled = true;
    elementsDict.double.disabled = true;
    elementsDict.split.disabled = true;
    elementsDict.rest.disabled = true;
    descGame.push(actualHandIndex + "-Pige-");
    takeCard();
    await sleep(750);
    if (hands[actualHandIndex].stringValue().length < 3 && hands[actualHandIndex].intValue() > 20) {
        nextHand();
    } else {
        elementsDict.hit.disabled = false;
        elementsDict.rest.disabled = false;
        elementsDict.double.disabled = false;
        if (hands[actualHandIndex].canSplit() && canDouble(actualHandIndex)) {
            elementsDict.split.disabled = false;
        }
    }
}

async function double() {
    if (playerBalance > startingBet) {
        addBalance(-startingBet);
        elementsDict.hit.disabled = true;
        elementsDict.double.disabled = true;
        elementsDict.split.disabled = true;
        elementsDict.rest.disabled = true;
        descGame.push(actualHandIndex + "-Double-");
        hands[actualHandIndex].betAmount = parseFloat(hands[actualHandIndex].betAmount) + parseFloat(startingBet);
        takeCard();
        await sleep(750);
        nextHand();
    } else {
        console.log("not enough cash to double")
    }
}

function nextHand() {
    descGame.push(actualHandIndex + "-Reste;");
    //Removes class actual-hand if there
    var handCards = document.getElementById(hands[actualHandIndex].elementID).children;
    for (var i = 0; i < handCards.length; i++) {
        if (handCards[i].classList.length > 1) {
            handCards[i].classList.remove(handCards[i].classList.item(handCards[i].classList.length - 1));
        }
    }
    actualHandIndex++;
    if (actualHandIndex == hands.length) {
        bankTurn();
        elementsDict.rest.disabled = true;
    } else {
        handCards = document.getElementById(hands[actualHandIndex].elementID).children;
        for (var i = 0; i < handCards.length; i++) {
            handCards[i].classList.add("actual-hand");
        }
        elementsDict.rest.disabled = false;
        elementsDict.hit.disabled = false;
        if (playerBalance > hands[actualHandIndex].betAmount) {
            elementsDict.double.disabled = false;
        }
        if (hands[actualHandIndex].canSplit() && canDouble(actualHandIndex)) {
            elementsDict.split.disabled = false;
        }
    }
}

async function bankTurn() {
    flipCard(hands[0].cardList[1].element);
    await sleep(500);
    document.getElementById(hands[0].sumID).innerHTML = 'Total: ' + hands[0].intValue();
    actualHandIndex = 0;
    var handAlive = false;
    for (var i = 1; i < hands.length; i++) {
        const value = hands[i].intValue();
        if (value < 22 && !(value == 21 && hands[i].cardList.length == 2)) {
            handAlive = true;
        }
    }
    if (handAlive) {
        while (hands[0].intValue() < 17) {
            descGame.push("0-Pige-");
            takeCard();
            await sleep(1000);
        }
    }
    const valueB = hands[0].intValue();
    for (var i = 1; i < hands.length; i++) {
        actualHandIndex = i;
        const valuePl = hands[i].intValue();
        if (valuePl == 21 && hands[i].cardList.length == 2) {
            setPlayerElClass("winner");
            continue;
        }
        if (valuePl > 21) {
            setPlayerElClass("loser");
        } else if (valueB > 21) {
            setPlayerElClass("winner");
            addBalance(hands[i].betAmount * 2);
        } else if (valueB == valuePl) {
            setPlayerElClass("draw");
            addBalance(hands[i].betAmount * 1);
        } else if (valueB < valuePl) {
            setPlayerElClass("winner");
            addBalance(hands[i].betAmount * 2);
        } else {
            setPlayerElClass("loser");
        }
    }
    softReset();
}

function save() {
    var betAmount = 0;
    for (var i = 1; i < hands.length; i++) {
        betAmount += parseFloat(hands[i].betAmount);
    }
    const data = {
        username: username,
        game: "Blackjack",
        amount: betAmount,
        payout: payoutTotal,
        details: descGame.join("")
    };

    fetch('/api/bet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            /*
            if (data.success) {
                console.log("bet saved succesfully")
            } else {
                console.log("error saving bet: ", data.error);
            }
            */
        })
        .catch(error => {
            console.error('Error during POST:', error);
        })
}




