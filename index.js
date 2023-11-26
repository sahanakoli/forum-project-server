const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6oh3q2n.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db('forumDb').collection('users');
    const postCollection = client.db('forumDb').collection('posts');


    // middlewares
    const verifyToken = (req, res, next) =>{
      console.log('inside verify token', req.headers.authorization);
      if(!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
        if(err){
          return res.status(401).send({message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
      })
    }
    
    // use verify admin after verifyToken
    const verifyAdmin = async(req, res, next) =>{
      const email = req.decoded.email;
    const query = {email: email};
    const user = await userCollection.findOne(query);
    const isAdmin = user?.role === 'admin';
    if(!isAdmin){
      return res.status(403).send({message: 'forbidden access'});
    }
    next();
    }


    // jwt related api
    app.post('/jwt', async(req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res.send({token});
    })
    
    
    // user related api
    app.get('/users',  async(req, res) =>{
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post('/users', async(req, res) =>{
        const user = req.body;
        
        const query = { email: user.email}
        const existingUser = await userCollection.findOne(query);
        if(existingUser){
        return res.send({ message: 'user already exists', insertedId: null})
        }
        const result = await userCollection.insertOne(user);
        // console.log('user data', result)

        res.send(result);
    });

    app.get('/users/:email', verifyToken, async(req, res) =>{
      const email = req.params.email;
      const query = { email: email}
      const result = await userCollection.findOne(query).toArray();
      console.log('user data', result)
      res.send(result);
    })

    app.get('/users/admin/:email',  verifyToken, async(req, res) =>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({ message: 'forbidden access'})
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin});
    });

    app.patch('/users/admin/:id', verifyToken,   async(req, res) =>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // post related api
    app.post('/posts', async(req, res) =>{
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
    });

    // app.get('/posts', async(req, res) =>{
    //   const result = await postCollection.find().toArray();
    //   res.send(result);
    // })




    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req,res) =>{
    res.send('forum server is running')
})

app.listen(port, () =>{
    console.log(`forum server running on the port ${port}`)
})