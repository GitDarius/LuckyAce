import express, { application, query } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";
import { error } from "console";
import { MongoClient, ObjectId } from 'mongodb';
import { config } from "dotenv";
import axios from 'axios';
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
Configuration de EJS
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/*
Importation de Bootstrap
*/
app.use("/js", express.static(__dirname + "/node_modules/bootstrap/dist/js"));
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));

/*
Importation de public
*/
app.use(express.static(path.join(__dirname, "public")));

/*
//Connection au server MySQL
const con = mysql.createConnection({
    host: "localhost",
    user: "scott",
    password: "oracle",
    database: "luckyacebd"
});
con.connect(function (err) {
    if (err) throw err;
    console.log("database connected!");
});
*/

//Connection do MangoDB
const con = await connectToMango();
async function connectToMango() {
    config();
    const uri = process.env.DB_URI;
    let mongoClient;
    try {
        mongoClient = new MongoClient(uri);
        console.log("Connection à MongoDB...");
        await mongoClient.connect();
        console.log("Connecté à MongoDB!");
        return mongoClient;
    } catch (error) {
        console.error("Erreur de connexion à MongoDB!", error);
        process.exit();
    }
}

/*
Connect to server
*/
const server = app.listen(4000, function () {
    console.log("serveur fonctionne sur 4000... ! ");
});

/*
Permettre l'utilisation de body lors des POST request
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Gets
app.get("/sign_up", function (req, res) {
    res.render("pages/sign_up");
});

app.get("/blackjack", function (req, res) {
    res.render("pages/blackjack");
});

app.get("/sign_in", function (req, res) {
    res.render("pages/sign_in");
});

app.get("/", function (req, res) {
    res.render("pages/index.ejs");
});

app.get("/admin", async function (req, res) {
    try {
        const users = await con.db("luckyacebd").collection("players").find({}, { projection: { username: 1, _id: 0 } }).toArray();

        res.render("pages/admin.ejs", { users: users });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

app.get("/player", function (req, res) {
    res.render("pages/player.ejs");
});

app.get("/head-tails", function (req, res) {
    res.render("pages/head-tails.ejs");
});

app.get("/rock-paper-scissors", function (req, res) {
    res.render("pages/rock-paper-scissors.ejs");
});

//Posts (Ctrl + Alt + F to format code)
app.post('/api/bet', async (req, res) => {
    try {
        const { username, game, amount, payout, details } = req.body;
        const dateTime = new Date();

        const newBet = {
            username: username,
            game,
            dateTime,
            amount,
            payout,
            details
        };

        const result = await con.db("luckyacebd").collection("bets").insertOne(newBet);

        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post('/api/getBalance', async (req, res) => {
    try {
        const { username } = req.body;

        const player = await con.db("luckyacebd").collection("players").findOne(
            { username: username },
            { projection: { balance: 1, _id: 0 } }
        );

        if (!player) {
            return res.status(404).json({ error: "Player not found" });
        }

        res.json({ balance: player.balance });
    } catch (error) {
        console.error("MongoDB error:", error);
        res.status(500).json({ error: "Database error occurred" });
    }
});

app.post('/api/updateBalance', async (req, res) => {
    try {
        const { newBalance, username } = req.body;

        const result = await con.db("luckyacebd").collection("players").updateOne(
            { username: username },
            { $set: { balance: newBalance } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Player not found" });
        }

        res.json({ message: "Balance updated successfully", modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error("MongoDB error:", error);
        res.status(500).json({ error: "Database error occurred" });
    }
});

app.post('/api/admin/updatePlayer', async (req, res) => {
    try {
        const { username, newUsername, email, password, balance } = req.body;
        const updateData = {
            username: newUsername,
            email,
            password,
            balance
        };

        const result = await con.db("luckyacebd").collection("players").updateOne(
            { username },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Player not found" });
        }

    } catch (error) {
        console.error("MongoDB error:", error);
        res.status(500).json({ error: "Database error occurred" });
    }
});

app.post('/api/admin/customQuery', async (req, res) => {
    try {
        const { collection, query = {}, options = {} } = req.body;

        if (!collection || typeof collection !== 'string') {
            return res.status(400).json({ error: 'Invalid collection name' });
        }

        const results = await con
            .db("luckyacebd")
            .collection(collection)
            .find(query, options)
            .sort({ dateTime: -1 })
            .toArray();

        res.json({ success: true, results });
    } catch (error) {
        console.error("MongoDB error from admin:", error);
        res.status(500).json({ error: "Database error occurred" });
    }
});

app.post('/api/admin/delete', async (req, res) => {
    try {
        const { collection, _id } = req.body;

        if (!collection || typeof collection !== 'string') {
            return res.status(400).json({ error: 'Invalid collection name' });
        }

        const objectId = new ObjectId(_id);

        const result = await con
            .db("luckyacebd")
            .collection(collection)
            .deleteOne({ _id: objectId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "No document found with that _id" });
        }


        res.json({ success: true, result });
    } catch (error) {
        console.error("MongoDB error from admin:", error);
        res.status(500).json({ error: "Database error occurred" });
    }
});

app.post('/api/admin/getPlayerInfo', async (req, res) => {
    try {
        const { username } = req.body;

        const results = await con.db("luckyacebd").collection("players").findOne({ username }, {})

        if (!results) {
            return res.json({ success: false, error: "Player not found." });
        }

        return res.json({ success: true, results });
    } catch (error) {
        console.error("Mongo error from getPassword:", error);
        res.json({ error: 'Database error occurred' });
    }
})

app.post('/api/usernameExists', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const player = await con.db("luckyacebd").collection("players").findOne({ username });

        if (player) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error("Mongo error from username_exists:", error);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

app.post('/api/emailExists', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const player = await con.db("luckyacebd").collection("players").findOne({ email });

        if (player) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error("Mongo error from Email_exists:", error);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

app.post('/api/sign_up/createPlayer', async (req, res) => {
    try {
        const { username, email, password, balance } = req.body.dataset;

        if (!username || !email || !password || !balance) {
            console.log("Missing data.");
            return res.status(400).json({ error: "Missing required fields." });
        }
        const result = await con
            .db("luckyacebd")
            .collection("players")
            .insertOne({
                username,
                email,
                password,
                balance
            })
        res.status(201).json({ success: true });

    } catch (error) {
        console.error("Mongo error from create player:", error);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

app.post('/api/sign_in/getPassword', async (req, res) => {
    try {
        const { usernameEmail } = req.body;

        if (!usernameEmail) {
            console.log("Missing data.");
            return res.json({ error: "Missing required fields." });
        }

        // Search for a player where either the username or email matches usernameEmail.
        const player = await con.db("luckyacebd").collection("players").findOne(
            { $or: [{ username: usernameEmail }, { email: usernameEmail }] },
            { projection: { password: 1, _id: 0 } }
        );

        if (!player) {
            //201 instead of 404 because it gives away that the user doesnt exist
            return res.json({ success: false, error: "Player not found." });
        }

        res.json({ success: true, password: player.password });
    } catch (error) {
        console.error("Mongo error from getPassword:", error);
        res.json({ error: 'Database error occurred' });
    }
});

app.post('/api/createTicket', async (req, res) => {
    try {
        const { username, text, category } = req.body;

        if (!username || !text || !category) {
            console.log("Missing data.");
            return res.status(400).json({ error: "Missing required fields." });
        }
        const dateTime = new Date();
        const result = await con
            .db("luckyacebd")
            .collection("tickets")
            .insertOne({
                username,
                text,
                dateTime,
                category,
                status : 'open'
            })
        res.status(201).json({ success: true });

    } catch (error) {
        console.error("Mongo error from create ticket:", error);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

app.post('/api/createDeposit', async (req, res) => {
    try {
        const { username, amount, email, direction } = req.body;

        if (!username || !amount || !direction) {
            console.log("Missing data.");
            return res.status(400).json({ error: "Missing required fields." });
        }

        const dateTime = new Date();
        const result = await con
            .db("luckyacebd")
            .collection("deposits")
            .insertOne({
                username,
                amount,
                dateTime,
                email, 
                direction
            })
        res.status(201).json({ success: true });

    } catch (error) {
        console.error("Mongo error from create deposit:", error);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

//API
const PAYPAL_BASE = 'https://api.sandbox.paypal.com';

//The token is like a ticket to let me use the paypal API to make a request
async function getAccessToken() {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
    try {
        const response = await axios.post(`${PAYPAL_BASE}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error obtaining access token:', error.response ? error.response.data : error.message);
        throw new Error('Could not obtain access token');
    }
}

//This is like saying to paypal, 'Hey, my user wants to give me x$'. Then paypal says 'Darius? (bacause of the token) Sure mate, just go to that link, everything is ready to guide the user'
app.post('/create-purchase', async (req, res) => {
    const { amount } = req.body;
    if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
    }
    try {
        const accessToken = await getAccessToken();
        const orderResponse = await axios.post(`${PAYPAL_BASE}/v2/checkout/orders`, {
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: "CAD",
                    value: amount
                }
            }],
            application_context: {
                return_url: "http://localhost:4000/?paypal", //I didnt know how to close the pop-up and still know if the transaction worked
                cancel_url: "http://localhost:4000/?paypal" //So I redirected it to the mainpage which has a script to handle it
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(orderResponse.data);
    } catch (error) {
        console.error('Error creating purchase:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error creating purchase' });
    }
});

//Once the user finished it's work with paypal, we go ask paypal how it went
app.post('/capture-order', async (req, res) => {
    const { orderID } = req.body;
    if (!orderID) {
        return res.status(400).json({ error: 'OrderID is required' });
    }
    try {
        const accessToken = await getAccessToken(); // Reuse your helper function
        const captureResponse = await axios.post(
            `${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(captureResponse.data);
    } catch (error) {
        console.error('Error capturing order:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error capturing order' });
    }
});

app.post('/payout', async (req, res) => {
    const { email, amount } = req.body;

    if (!email || !amount) {
        return res.status(400).json({ error: 'Recipient email and amount are required' });
    }

    try {
        const accessToken = await getAccessToken();

        const senderBatchId = Math.random().toString(36).substring(2, 15);

        const payload = {
            sender_batch_header: {
                sender_batch_id: senderBatchId,
                email_subject: "You have a payout from Our Casino",
                email_message: "You have received a payout from our casino account."
            },
            items: [{
                recipient_type: "EMAIL",
                amount: {
                    value: amount,
                    currency: "CAD"
                },
                receiver: email,
                note: "Thank you for using our service!",
                sender_item_id: "item_1"
            }]
        };

        // Make a POST request to the Payouts endpoint
        const payoutResponse = await axios.post(`${PAYPAL_BASE}/v1/payments/payouts`, payload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(payoutResponse.data);
    } catch (error) {
        console.error("Error processing payout:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error processing payout' });
    }
});
