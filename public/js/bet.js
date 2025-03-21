import {getBet, clamp} from '/js/utils.js';

document.getElementById('half_bet').addEventListener('click', halfBet);
document.getElementById('double_bet').addEventListener('click', doubleBet);

function halfBet() {
    if(isNaN(getBet())){return}
    let bet = getBet();
    let betInput = document.getElementById("bet_amount");
    bet = clamp(0.01, -1, bet / 2);
    let stringBet = (bet).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    betInput.value = stringBet;
}

function doubleBet() {
    if(isNaN(getBet())){return}
    let bet = clamp(0.01, Number.MAX_SAFE_INTEGER, getBet() * 2);
    let betInput = document.getElementById("bet_amount");
    let stringBet = (bet).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    betInput.value = stringBet;

}