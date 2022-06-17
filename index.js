const express = require('express');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const session = require('express-session');
const mongoDBSession = require('connect-mongodb-session')(session);

const UserSchema = require('./UserSchema');
const TodoSchema = require('./TodoSchema');

const app = express();

// Template Literal/Strings
const mongoURI = `mongodb+srv://myappuser:ritikkumar@cluster0.mjfcg.mongodb.net/backendjs?retryWrites=true&w=majority`;

const store = new mongoDBSession({
    uri: mongoURI,
    collection: 'sessions'
})

// Middleware -> After request before api call 
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// EJS -> Template Rendering Engine 
app.set('view engine', 'ejs');

// Adds the session object in req 
app.use(session({
    secret: 'hello backendjs',
    resave: false,
    saveUninitialized: false,
    store: store
}))

mongoose.connect(mongoURI, {
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

app.get('/login', (req, res) => {
    console.log(res);
    res.render('login');
})

app.get('/register', (req, res) => {
    res.render('register');
})

function cleanUpAndValidate({name, username, phone, email, password}) {
    return new Promise((resolve, reject) => {

        if(typeof(email) !== 'string')  
            reject('Invalid Email');
        if(typeof(username) !== 'string')  
            reject('Invalid Username');
        if(typeof(name) !== 'string')  
            reject('Invalid name');
        if(typeof(password) !== 'string')
            reject('Invalid Password');

        // Empty strings evaluate to false
        if(!username || !password || !name || !email)
            reject('Invalid Data');

        if(username.length < 3 || username.length > 100) 
            reject('Username should be 3 to 100 charcters in length');
        
        if(password.length < 5 || password > 300)
            reject('Password should be 5 to 300 charcters in length');

        if(!validator.isEmail(email)) 
            reject('Invalid Email');

        if(phone !== undefined && typeof(phone) !== 'string') 
            reject('Invalid Phone');
        
        if(phone !== undefined && typeof(phone) === 'string') {
            if(phone.length !== 10 && validator.isAlphaNumeric(phone)) 
                reject('Invalid Phone');
        }

        resolve();
    })
}

// Allows user to register
app.post('/register', async (req, res) => {
    const { name, username, password, phone, email } = req.body;

    // Validation of Data
    try {
        await cleanUpAndValidate({name, username, password, phone, email});
    }
    catch(err) {
        return res.send({
            status: 400, 
            message: err
        })
    }

    let userExists;
    // Check if user already exists
    try {
        userExists = await UserSchema.findOne({email});
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Internal Server Error. Please try again.",
            error: err  
        })
    }

    if(userExists) 
        return res.send({
            status: 400,
            message: "User with email already exists"
        })

    try {
        userExists = await UserSchema.findOne({username});
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Internal Server Error. Please try again.",
            error: err  
        })
    }

    if(userExists) 
        return res.send({
            status: 400,
            message: "Username already taken"
        })

    // Hash the password Plain text -> hash 
    const hashedPassword = await bcrypt.hash(password, 13); // md5
    
    let user = new UserSchema({
        name,
        username,
        password: hashedPassword,
        email,
        phone
    })

    try {
        const userDb = await user.save(); // Create Operation
        return res.send({
            status: 200,
            message: "Registration Successful",
            data: {
                _id: userDb._id,
                username: userDb.username,
                email: userDb.email
            }
        });
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Internal Server Error. Please try again.",
            error: err  
        })
    }
})

app.post('/login', async (req, res) => {

    // loginId can be either email or username
    const { loginId, password } = req.body;

    if(typeof(loginId) !== 'string' || typeof(password) !== 'string' || !loginId || !password) {
        return res.send({
            status: 400,
            message: "Invalid Data"
        })
    }

    // find() - May return you multiple objects, Returns empty array if nothing matches, returns an array of objects 
    // findOne() - One object, Returns null if nothing matches, returns an object 
    let userDb;
    try {
        if(validator.isEmail(loginId)) {
            userDb = await UserSchema.findOne({email: loginId}); 
        }
        else {
            userDb = await UserSchema.findOne({username: loginId});
        }
    }
    catch(err) {
        console.log(err);
        return res.send({
            status: 400,
            message: "Internal server error. Please try again",
            error: err
        })
    }
    
    console.log(userDb);

    if(!userDb) {
        return res.send({
            status: 400,
            message: "User not found",
            data: req.body
        });
    }

    // Comparing the password
    const isMatch = await bcrypt.compare(password, userDb.password);

    if(!isMatch) {
        return res.send({
            status: 400,
            message: "Invalid Password",
            data: req.body
        });
    }

    req.session.isAuth = true;
    req.session.user = { username: userDb.username, email: userDb.email, userId: userDb._id };

    res.send({
        status: 200,
        message: "Logged in successfully"
    });
})

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) throw err;

        res.send('Logged out successfully');
    })
})

app.get('/dashboard', (req, res) => {
    if(!req.session.isAuth) {
        return res.send('You are not logged in. Please log in.');
    }
    res.render('dashboard');
})

// CRUD - Create, Read, Update, Delete
app.post('/create-todo', async (req, res) => {

    if(!req.session.isAuth) {
        return res.send({
            status: 400,
            message: "You are not logged in. Please log in to create todos."
        })
    }
    
    const { todo } = req.body;

    if(!todo) {
        return res.send({
            status: 400,
            message: "Invalid Todo"
        })
    }

    const userId = req.session.user.userId;
    const creation_datetime = new Date();

    const todoObj = new TodoSchema({
        todo,
        userId,
        creation_datetime
    });

    try {
        const todoDb = await todoObj.save();

        return res.send({
            status: 200,
            message: "Todo created successfully",
            data: todoDb
        })
    }
    catch(err) {
        return res.send({
            status: 400,
            message: 'Internal server error. Please try again.'
        })
    }
})

app.post('/edit-todo', (req, res) => {

})

app.post('/delete-todo', (req, res) => {

})

app.listen(3000, () => {
    console.log('Listening on port 3000');
})

// app.get('/profile/:id/:name', (req, res) => {
//     console.log(req.params.id, req.params.name);
//     res.send('My name is Ritik');
// })

// app.get('/order', (req, res) => {
//     console.log(req.query);
//     res.send('Order placed successfully');
// })

// app.get('/payment', (req, res) => {
//     res.send('Payment received');
// })

// app.post('/payment', (req, res) => {
//     res.send('Payment done successfully');
// })

// app.post('/order', (req, res) => {
//     console.log(req.body);

//     res.send('Ordered Successfully');
// })

// let users = [
//     {
//         userId: 1,
//         name: "Karl"
//     }
// ]; 

// let nextUserId = 2;

// // Read API -> Reads data from the db
// app.get('/users', (req, res) => {
//     res.send(users);
// })

// // Create a new entry in the database
// app.post('/users', (req, res) => {
//     const name = req.body.name;
//     const user = {
//         userId: nextUserId,
//         name: name
//     }
//     nextUserId++;

//     users.push(user);

//     res.send("User successfully registered");
// })

// // Update or modify a data
// app.patch('/users', (req, res) => {

//     const { name, userId } = req.body;

//     users.map(user => {
//         if(user.userId == userId) {
//             user.name = name;
//         }
//         return user;
//     })

//     res.send("Update done successfully");
// })

// // Updates if the obj is present otherwise it adds it to the db
// app.put('/users', (req, res) => {

//     const { name, userId } = req.body;
//     let recordUpdated = false;

//     users.map(user => {
//         if(user.userId == userId) {
//             recordUpdated = true;
//             user.name = name;
//         }
//         return user;
//     })

//     if(recordUpdated) {
//         return res.send("User Updated Successfully");
//     }

//     let user = {
//         userId: userId,
//         name: name
//     }

//     users.push(user);

//     res.send("User Added successfully");
// })

// // Deletes an obj from the db
// app.delete('/users', (req, res) => {

//     const { userId } = req.body;

//     users = users.filter(user => user.userId !== userId);

//     res.send("User Deleted Successfully");
// })

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

// Lazy Loading 

// index.js - main function 

// Node - runtime environment 

// Status Codes - 200 - Successful, 400 - Failed

// Security 
// Database access - Create a user. Note: Your password should not have @ symbol
// Network access - Add IP - 0.0.0.0/0 
// a. If you want only your machine to access the db replace 0.0.0.0 with your machine ip
// b. To find your machine's ip:
//   aa. Linux - ifconfig
//   ab. Windows - ipconfig
//   ac. Mac - System Preferences -> Network

// hoisting in JS