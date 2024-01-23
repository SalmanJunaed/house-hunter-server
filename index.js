const express = require("express")
const app = express()
const cors = require("cors")
require("dotenv").config()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())

//DB_USER=houseHunter
//DB_PASS=7education17

const { MongoClient, ServerApiVersion } = require("mongodb")
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rw04ymy.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
})

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect()

        // Database collection 
        const userCollection = client.db('houseHunterDB').collection('users');
        const houseCollection = client.db('houseHunterDB').collection('homes');

        //API 

        // home related API
        app.get('/house', async(req, res) =>{
            const result = await houseCollection.find().toArray();
            res.send(result);
        })


        //JWT related API
        app.post('/jwt', async(req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5000h' })
            res.send({ token });
        })

        //middlewares 
        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({message: 'unauthorized access'})
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if(err){
                    return res.status(401).send({message: 'unauthorized access'})
                }
                req.decoded = decoded;
                next();
            })
        }

        // User related API
        // POST operation for register 
        app.post('/newUser', async(req, res) =>{
            const newUser = req.body;
            const query = {email: newUser?.email};
            const existingUser = await userCollection.findOne(query);
            if(existingUser){
                return res.send({massage:'The Email Exists', insertedId: null})
            }
            // console.log(newUser);
            const result = await userCollection.insertOne(newUser);
            res.send(result);
        })
        // POST user login 
        app.post('/userLogin', async (req, res) => {
            const loginValue= req.body;

            const email = loginValue?.email;
            const password = loginValue?.password;
            const query = {email : email};

            const existingUser = await userCollection.findOne(query);

            if(!existingUser)
            {
                return res.send({ login: false, message: 'User invalid'})
            }

            if (existingUser?.password !== password)
            {
                return res.send({login: false, massage: 'invalid information'})
            }

            res.send({login: true, existingUser})
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 })
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        )
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir)

app.get("/", (req, res) => {
    res.send("House Hunter is Running")
})

app.listen(port, () => {
    console.log(`House Rental project is sitting on port.. ${port}`)
})
