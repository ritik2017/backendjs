const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Welcome to our app');
})

app.get('/profile/:id/:name', (req, res) => {
    console.log(req.params.id, req.params.name);
    res.send('My name is Ritik');
})

app.get('/order', (req, res) => {
    console.log(req.query);
    res.send('Order placed successfully');
})

app.get('/payment', (req, res) => {
    res.send('Payment received');
})

app.post('/payment', (req, res) => {
    res.send('Payment done successfully');
})

app.listen(3000, () => {
    console.log('Listening on port 3000');
})


// npm init -> Initiazed the repository to run js
// npm install express
// npm install nodemon 

// Sending data in form of params /:id -> compulsory, variable names are defined at Backend
// Sending data in form of query  ?product=18393 -> not compulsory, variable names are defined by frontend