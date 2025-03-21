import { sleep, saveBalance, betIsValidNumber, getBet, getUser, getPlayerBalance } from './utils.js';

//Beginning of global variables
var username = await getUser();
var descGame = [];
var payoutTotal = 0;
var startingBet = 0;
var playerBalance = await getPlayerBalance(username);
var playerchoice = -1;
var bankchoice = -1;

const rock_image = document.getElementById("r_image");
const paper_image = document.getElementById("p_image");
const scissors_image = document.getElementById("s_image");

const playerSelectionImage = document.getElementById("player_choice_image");
const bankSelectionImage = document.getElementById("bank_choice_image");

//Assign commands
document.getElementById('button_start_game').addEventListener('click', startGame);
document.getElementById('r_image').addEventListener('click', (event) => {
  selectChoice(0)
});
document.getElementById('p_image').addEventListener('click', (event) => {
  selectChoice(1)
});
document.getElementById('s_image').addEventListener('click', (event) => {
  selectChoice(2)
});

//End assign

function selectChoice(choice) {
  playerchoice = choice;

  switch (choice) {
    case 0:
      rock_image.classList.add("rps-selected")
      paper_image.classList.remove("rps-selected")
      scissors_image.classList.remove("rps-selected")
      playerSelectionImage.src = "/images/rock_icon.png";
      break;
    case 1:
      rock_image.classList.remove("rps-selected")
      paper_image.classList.add("rps-selected")
      scissors_image.classList.remove("rps-selected")
      playerSelectionImage.src = "/images/paper_icon.png";
      break;
    case 2:
      rock_image.classList.remove("rps-selected")
      paper_image.classList.remove("rps-selected")
      scissors_image.classList.add("rps-selected")
      playerSelectionImage.src = "/images/scissors_icon.png";
      break;
    default:
      console.log("Issues during selection");
      break;
  }
}

async function startGame() {
  const button = document.getElementById('button_start_game');
  if (!betIsValidNumber(playerBalance)) { return; }
  if (bankchoice != -1) {
    resetGame(button)
    return;
  }
  const warnEl = document.getElementById("input_warning_message");
  if(playerchoice == -1){
    warnEl.innerHTML = "Choisissez un signe à jouer";
    warnEl.style.display = 'block';
    return;
  }else{
    warnEl.style.display = 'none';
  }
  button.disabled = true;
  startingBet = getBet();
  addBalance(-startingBet);

  bankchoice = Math.floor(Math.random() * 3);

  var baseTime = 50;

  for (var i = 0; i < bankchoice + 30; i++) {
    switch (i % 3) {
      case 0:
        bankSelectionImage.src = "/images/rock_icon.png";
        break;
      case 1:
        bankSelectionImage.src = "/images/paper_icon.png";
        break;
      case 2:
        bankSelectionImage.src = "/images/scissors_icon.png";
        break;
      default:
        console.log("Issues during selection");
        break;
    }

    var sleepTime = baseTime * (1 + (i ** 2) / ((bankchoice + 30 - 1) ** 2));
    await sleep(sleepTime);
  }

  switch (bankchoice) {
    case 0:
      bankSelectionImage.src = "/images/rock_icon.png";
      break;
    case 1:
      bankSelectionImage.src = "/images/paper_icon.png";
      break;
    case 2:
      bankSelectionImage.src = "/images/scissors_icon.png";
      break;
    default:
      console.log("Issues during selection");
      break;
  }

  var result = "";

  if (playerchoice == bankchoice) {
    result = "push"
  }
  else if ((bankchoice + 1) % 3 == playerchoice) {
    result = "win";
  }
  else {
    result = "loss";
  }

  switch (result) {
    case "push":
      addBalance(startingBet);
      break;
    case "win":
      addBalance(2 * startingBet);
      break;
    case "loss":
      break;
  }

  descGame.push(`[${choiceToString(playerchoice)}]:[${choiceToString(bankchoice)}]`);
  save();
  button.disabled = false;
  button.innerHTML = "Recommencer";
}

function choiceToString(choiceNumber) {

  switch (choiceNumber) {
    case 0:
      return "Rock";
    case 1:
      return "Paper";
    case 2:
      return "Scissors";
  }
}

function addBalance(balanceIncrease) {
  const balanceEl = document.getElementById("balance");
  playerBalance += parseFloat(balanceIncrease);
  balanceEl.innerHTML = playerBalance;
  if (balanceIncrease > 0) {
    payoutTotal += parseFloat(balanceIncrease);
  }
  if (balanceIncrease != 0) {
    saveBalance(playerBalance, username);
  }
}

async function resetGame(button) {
  bankSelectionImage.src = "/images/question_mark.png";
  bankchoice = -1;

  descGame = [];
  payoutTotal = 0;
  button.innerHTML = "Commencer";
}

function save() {
  const data = {
    username: username,
    game: "Roche Papier Ciseaux",
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