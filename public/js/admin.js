import { getUser, loi96, showSuccess } from '/js/utils.js'

const username = await getUser();

//Variables globales
var previousInfos = {};
const formElements = {};
var collection = '';
const tableEl = document.getElementById("table");
const tableBox = document.getElementById("table_box");
const formBox = document.getElementById("form_box");
const formEl = document.getElementById('admin_form');

document.getElementById('admin_search_button').addEventListener('click', update);
document.getElementById('admin_form_cancel').addEventListener('click', resetForm);
document.getElementById('admin_confirm_form').addEventListener('click', confirmForm);
document.getElementById('admin_form_save').addEventListener('click', saveForm);
document.getElementById('admin_cancel_form').addEventListener('click', resetForm);
document.getElementById('admin_confirm_form').addEventListener('click', confirmForm);
document.getElementById('form_delete_element').addEventListener('click', deleteElement);


function update() {
    resetForm();
    resetTable();
    const valueSelect = document.getElementById("value-target").value;
    switch (valueSelect) {
        case 'infos':
            collection = 'players';
            break;
        case 'paris':
            collection = 'bets';
            break;
        case 'transactions':
            collection = 'deposits';
            break;
        case 'tickets':
            collection = 'tickets';
            break;
        default:
            console.log('collection undectabale: ' + valueSelect)
            collection = '';
    }
    //Truc à gauche de find
    var query = {};
    var options = {};
    
    fetchInfos(collection, query, options)

}

async function fetchInfos(collection, query, options) {
    await fetch('/api/admin/customQuery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ collection, query, options })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                fillTable(data.results);
                formBox.hidden = true;
                tableBox.hidden = false;
            } else {
                console.error('data not success', data.error);
            }

        })
        .catch(error => {
            console.error('Error executing query:', error);
        });
}

function resetTable() {
    tableEl.innerHTML = "";
    tableBox.hidden = true;
}

function resetForm() {
    formEl.innerHTML = '';
    formBox.hidden = true;
    clearConfirmForm();
}

function fillTable(array) {
    if (array.length == 0) {
        const row = document.createElement("tr");
        const th = document.createElement("th");
        th.innerHTML = "Aucune valeur trouvée";
        row.appendChild(th);
        tableEl.appendChild(row);
        return;
    }
    const headers = Object.keys(array[0]);
    const headerRow = document.createElement("tr");
    for (let i = 0; i < headers.length; i++) {
        const th = document.createElement("th");
        th.innerHTML = loi96(headers[i]);
        headerRow.appendChild(th);
    }
    tableEl.appendChild(headerRow);

    for (let i = 0; i < array.length; i++) {
        const row = document.createElement("tr");
        const rowKeys = Object.keys(array[i]);

        row.addEventListener('click', (event) => {
            fillForm(rowKeys, array[i]);
        });

        for (let j = 0; j < rowKeys.length; j++) {
            const td = document.createElement("td");
            let value = array[i][rowKeys[j]];
            if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                value = new Date(value).toLocaleString();
            }
            td.innerHTML = value;
            row.appendChild(td);
        }
        tableEl.appendChild(row);
    }
}

function fillForm(keys, array) {
    formEl.innerHTML = '';
    formBox.hidden = false;
    previousInfos = {};
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = array[key];
        previousInfos[key] = value;
        if(key === '_id'){continue;}
        const div = document.createElement('div');
        div.classList.add('form-row');
        const label = document.createElement('label');
        label.innerHTML = loi96(key);
        const input = document.createElement('input');
        input.value = value;
        formElements[key] = input;
        div.appendChild(label);
        div.appendChild(input);
        formEl.appendChild(div);
    }
}

function saveForm() {
    try {
        clearConfirmForm();
        const keys = Object.keys(previousInfos);
        const confirmForm = document.getElementById("form_dif");
        var sameValues = true;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key === '_id') continue;
            let newValue = formElements[key].value;
            let oldValue = previousInfos[key];

            if (newValue != oldValue) {
                const label = document.createElement("label");
                label.innerHTML = `${key} : ${oldValue} ==> ${newValue}`;
                confirmForm.insertBefore(label, confirmForm.firstChild);
                sameValues = false;
            }
        }
        if (!sameValues) {
            confirmForm.hidden = false;
        }
    } catch (err) {
        console.error("error while saving form", err)
    }
}

function confirmForm() {
    const confirmForm = document.getElementById("form_dif");
    confirmForm.hidden = true;
    const keys = Object.keys(previousInfos);
    var saveForm = false;
    const data = {};
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key === '_id') continue;

        let newValue = formElements[key].value;
        let oldValue = previousInfos[key];

        if (newValue != oldValue) {
            saveForm = true;
        }

        if (key == 'username') {
            data['newUsername'] = newValue;
            data['username'] = oldValue;
            continue;
        }

        data[key] = newValue;
    }
    if (!saveForm) { console.log('No need to save'); }
    if (!saveForm) {
        showSuccess();
        return;
    }

    data.balance = parseFloat(data.balance);
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
    resetForm();
    showSuccess();
}

function clearConfirmForm() {
    const confirmForm = document.getElementById("form_dif");
    confirmForm.hidden = true;
    while (confirmForm.children.length > 1) {
        confirmForm.removeChild(confirmForm.firstChild);
    }
}

function deleteElement(){
    fetch('/api/admin/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({collection, _id : previousInfos._id})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(result => {
        if(result.success){
            showSuccess();
            update();
            resetForm();
        }
    })
    .catch(error => {
        console.error('Error executing query:', error);
    });
}