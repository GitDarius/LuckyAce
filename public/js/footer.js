import { getUser, showSuccess } from './utils.js'

const username = getUser();

const select = document.getElementById('ticket_category');
const textEl = document.getElementById('ticket_message');

document.getElementById('create_ticket').addEventListener('click', createTicket);

function createTicket() {
    const text = textEl.value;

    if (text == '') { return; }

    fetch('/api/createTicket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username, text, category: select.value})
    })
    .then(response => {
        if(!response.ok){
            throw new Error(`error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if(data.success){
            showSuccess();
            textEl.value = '';
        }
    })
    .catch(error => {
        console.error('Error executing query:', error);
    })

}


