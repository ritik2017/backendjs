const express = require('express');
const mongoose = require('mongoose');

const UserSchema = require('./UserSchema');

const app = express();

// Middleware -> After request before api call 
app.use(express.json());
app.use(express.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/backendjs', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(res => {
    console.log('Connected to db successfully');
}).catch(err => {
    console.log('Failed to connect', err);
})

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

app.post('/order', (req, res) => {
    console.log(req.body);

    res.send('Ordered Successfully');
})

let users = [
    {
        userId: 1,
        name: "Karl"
    }
]; 

let nextUserId = 2;

// Read API -> Reads data from the db
app.get('/users', (req, res) => {
    res.send(users);
})

// Create a new entry in the database
app.post('/users', (req, res) => {
    const name = req.body.name;
    const user = {
        userId: nextUserId,
        name: name
    }
    nextUserId++;

    users.push(user);

    res.send("User successfully registered");
})

// Update or modify a data
app.patch('/users', (req, res) => {

    const { name, userId } = req.body;

    users.map(user => {
        if(user.userId == userId) {
            user.name = name;
        }
        return user;
    })

    res.send("Update done successfully");
})

// Updates if the obj is present otherwise it adds it to the db
app.put('/users', (req, res) => {

    const { name, userId } = req.body;
    let recordUpdated = false;

    users.map(user => {
        if(user.userId == userId) {
            recordUpdated = true;
            user.name = name;
        }
        return user;
    })

    if(recordUpdated) {
        return res.send("User Updated Successfully");
    }

    let user = {
        userId: userId,
        name: name
    }

    users.push(user);

    res.send("User Added successfully");
})

// Deletes an obj from the db
app.delete('/users', (req, res) => {

    const { userId } = req.body;

    users = users.filter(user => user.userId !== userId);

    res.send("User Deleted Successfully");
})

app.post('/register', async (req, res) => {
    const { name, username, password, phone } = req.body;

    let user = new UserSchema({
        name,
        username,
        password,
        phone
    })

    const userDb = await user.save(); // Create Operation

    res.send(userDb);
})

app.listen(3000, () => {
    console.log('Listening on port 3000');
})


// npm init -> Initiazed the repository to run js
// npm install express
// npm install nodemon 

// Sending data in form of params /:id -> compulsory, variable names are defined at Backend
// Sending data in form of query  ?product=18393 -> not compulsory, variable names are defined by frontend
// Sending data in form of body  
// {
//     name: 'Ritik',
//     id: "123837",
//     order: {
//         pid: "3772hjd",
//         name: "Mobile"
//     }
// }

// We prefer to not send data in get api in req body

// /login
// /register 
// /logout 

// /auth/login 

// orm - Object-Relational Mapper - Helps us interact with our database from code

// Promise -> Processing, resolved, rejected 