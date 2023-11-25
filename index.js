const express = require('express');
require('dotenv').config();
const app = express();
const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


app.get('/', (req,res) =>{
    res.send('forum server is running')
})

app.listen(port, () =>{
    console.log(`forum server running on the port ${port}`)
})