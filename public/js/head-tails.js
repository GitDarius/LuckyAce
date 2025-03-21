import { sleep, saveBalance, betIsValidNumber, getBet, getUser, getPlayerBalance } from './utils.js';

//Beginning of global variables
var username = await getUser();
var descGame = [];
var payoutTotal = 0;
var startingBet = 0;
var playerBalance = await getPlayerBalance(username);
const predictionCoinHolder = document.getElementById("prediction_coins");
const resultCoinHolder = document.getElementById("result_coins");
const predictions = [0];
const predictionsEl = [];
//End of global variables

//Assign buttons commands
document.getElementById('nb_coins_select').addEventListener('change', (event) => {
  updateCoinsPrediction(event);
});
document.getElementById('first_coin').addEventListener('click', (event) => {
  flipCoin(event, 0)
});
document.getElementById('button_start_game').addEventListener('click', (event) => {
  startGame(event)
});
//End of assigns

//Comands to do at begining
predictionsEl.push(document.getElementById("first_coin"));
//End of commands

function flipCoin(event, coinIndex) {
  const coinElement = event.currentTarget;
  const coinInner = coinElement.querySelector('.coin-inner');
  let rotation = parseInt(coinInner.getAttribute('data-rotation')) || 0;
  rotation += 180;
  predictions[coinIndex] = rotation;
  coinInner.setAttribute('data-rotation', rotation);

  // Start the animation: throw the coin by scaling it up while rotating.
  coinInner.style.transform = `rotateX(${rotation}deg) scale(1.2)`;

  // After the full duration (750ms), settle to the normal size.
  setTimeout(() => {
    coinInner.style.transform = `rotateX(${rotation}deg) scale(1)`;
  }, 125);
}

function launchCoin(coinElement, flipAmount) {
  const coinInner = coinElement.querySelector('.coin-inner');
  let baseRotation = 0;

  const finalRotation = baseRotation + flipAmount * 180;
  const halfRotation = baseRotation + (flipAmount / 2) * 180;

  const phaseDuration = 1500;

  // Phase 1: Upward launch
  coinInner.style.transition = `transform ${phaseDuration}ms`;
  // Rotate halfway and scale up (simulate coin coming forward)
  coinInner.style.transform = `rotateX(${halfRotation}deg) scale(1.4)`;

  // After phase 1 completes, transition to phase 2: landing
  setTimeout(() => {
    coinInner.style.transition = `transform ${phaseDuration}ms ease-in`;
    // Complete rotation and scale back to normal size
    coinInner.style.transform = `rotateX(${finalRotation}deg) scale(1)`;

    // Update the stored rotation after the animation
    setTimeout(() => {
      coinInner.setAttribute('data-rotation', finalRotation);
    }, phaseDuration);
  }, phaseDuration - 300);
}

function updateCoinsPrediction(event) {
  const selectElement = event.currentTarget;
  var nbCoins = parseFloat(selectElement.value);
  if (!isNaN(nbCoins) && (nbCoins < 1 || nbCoins > 5)) { return; }
  if (!isNaN(nbCoins) && nbCoins > 0) {
    const nbCoinsCreated = predictionCoinHolder.children.length;
    var coinsDiff = nbCoinsCreated - nbCoins;
    if (coinsDiff > 0) {
      for (var i = 0; i < coinsDiff; i++) {
        predictionCoinHolder.removeChild(predictionCoinHolder.lastElementChild);
        predictions.pop();
        predictionsEl.pop();
      }
    } else {
      coinsDiff *= -1;
      for (var i = 0; i < coinsDiff; i++) {
        const coin = createCoin();
        coin.addEventListener('click', (event) => {
          flipCoin(event, predictions.length-1)
        });
        predictionCoinHolder.appendChild(coin);
        predictions.push(0);
        predictionsEl.push(coin);
      }
    }
  }
}

async function startGame(event) {
  const button = event.currentTarget;
  if (!betIsValidNumber(playerBalance)) {
    console.log("bet not valid number")
    return; 
  }
  if (resultCoinHolder.children.length > 0) {
    resetGame(button);
    return;
  }
  button.disabled = true;
  descGame.push(predictionToString());

  startingBet = getBet();
  addBalance(-startingBet);

  Array.from(predictionCoinHolder.children).forEach(element => {
    element.setAttribute('onclick', '');
  });
  var lost = false;
  descGame.push("[")
  for (var i = 0; i < predictions.length; i++) {
    const coin = createResultCoin();
    await sleep(100);
    const flipAmount = Math.floor(Math.random() * (6)) + 20;
    descGame.push(flipToString(flipAmount));
    if (i != predictions.length - 1) { descGame.push(", ") }
    launchCoin(coin, flipAmount);
    await sleep(3000);
    const predIsFace = predictions[i] % 360 == 0;
    const resultIsFace = flipAmount % 2 == 0;
    if (predIsFace != resultIsFace) {
      lost = true;
      coin.classList.add("coin-loser");
      predictionsEl[i].classList.add("coin-loser");
      break;
    } else {
      coin.classList.add("coin-winner");
      predictionsEl[i].classList.add("coin-winner");
    }
  }
  descGame.push("]")
  if (!lost) {
    const partialPayout = startingBet / (0.5 ** predictions.length);
    addBalance(partialPayout);
  }
  save();
  button.disabled = false;
  button.innerHTML = "Recommencer";
}

function addBalance(balanceIncrease) {
  const balanceEl = document.getElementById("balance");
  playerBalance += balanceIncrease;
  balanceEl.innerHTML = playerBalance;
  if (balanceIncrease > 0) {
    payoutTotal += balanceIncrease;
  }
  if (balanceIncrease != 0) {
    saveBalance(playerBalance, username);
  }
}

function createCoin() {
  const divEl = document.createElement("div");
  divEl.classList.add("coin");
  const divInner = document.createElement("div");
  divInner.classList.add('coin-inner')
  divInner.setAttribute('data-rotation', 0);
  const firstImg = document.createElement("img");
  firstImg.src = "/images/coin_tails_2.png";
  firstImg.classList.add("coin-back");
  const secondImg = document.createElement("img");
  secondImg.src = "/images/coin_head.png";
  secondImg.classList.add("coin-front");
  divEl.appendChild(divInner);
  divInner.appendChild(firstImg);
  divInner.appendChild(secondImg);
  return divEl;
}

function createResultCoin() {
  const coin = createCoin();
  resultCoinHolder.appendChild(coin);
  return coin;
}

async function resetGame(button) {
  const predictionCoins = predictionCoinHolder.children;
  for (var i = 0; i < predictionCoins.length; i++) {
    if (predictionCoins[i].classList.length > 1) {
      predictionCoins[i].classList.remove(predictionCoins[i].classList.item(predictionCoins[i].classList.length - 1));
    }
  }
  Array.from(predictionCoinHolder.children).forEach(element => {
    element.setAttribute('onclick', `flipCoin(this, ${predictions.length - 1})`);
  });
  resultCoinHolder.innerHTML = "";
  descGame = [];
  payoutTotal = 0;
  button.innerHTML = "Commencer";
}

function save() {
  const data = {
    username: username,
    game: "Pile ou Face",
    amount: parseFloat(startingBet),
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
      if (!data.success) {
        console.log("error saving bet: ", data.error);
      }
    })
    .catch(error => {
      console.error('Error during POST:', error);
    })

}

function predictionToString() {
  var result = "["
  for (var i = 0; i < predictions.length; i++) {
    result += predictions[i] % 360 == 0 ? "Head" : "Tails";
    if (i != predictions.length - 1) {
      result += ", ";
    }
  }
  result += "];"
  return result;
}

function flipToString(value) {
  return value % 2 == 0 ? "Head" : "Tails";
}