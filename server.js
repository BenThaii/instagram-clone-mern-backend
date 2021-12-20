import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import Pusher from 'pusher'
import dbModel from "./dbModel.js"              //need to have the .js because we are importing from a file

//app config
const app = express()
const port = process.env.PORT || 8080

const pusher = new Pusher({                     //to make our app real time
  appId: "1319661",
  key: "f34056e334218026e1b7",
  secret: "67803c073b9d98cd0011",
  cluster: "us2",
  useTLS: true
});


//middlewares
app.use(express.json())   // interpret everything as JSON
app.use(cors())         //for headers (security, etc...)
app.use((req, res, next) => {
    res.setHeader('Access-control-Allow-Origin", "*'),
    res.setHeader('Access-control-Allow-Headers", "*')
})

//DB config
const connection_url = 'mongodb+srv://admin:2dfmPNWrWkm8tWOY@cluster0.xegfg.mongodb.net/instaDB?retryWrites=true&w=majority'        // create a db named instaDB
mongoose.connect(connection_url, {
    useNewUrlParser: true,
})

mongoose.connection.once('open', () => {        //indicate that DB is connected 
    console.log('DB connected')

    //keep track of posts, if there are any changes, want to trigger an event
    const changeStream = mongoose.connection.collection('posts').watch()       
    // configure the reaction to changes in the change stream
    changeStream.on('change', (change) => {
        console.log('changeStream triggered on pusher...')
        console.log(change)
        console.log('end of change')

        //only react to changes that are due to an insertion of data (not modification of data)
        if (change.operationType ==='insert'){
            // triggered whenever a post is made (once for each post)
            console.log('trigerring IMG upload')

            const postDetails = change.fullDocument;        //detail of the change
            // set the trigger for downstream subscriber
            pusher.trigger('posts', 'inserted', {           //channel is posts (posts collection), event type is 'inserted', subscriber will se this event
                user: postDetails.user,
                caption: postDetails.caption,
                image: postDetails.image
            })
        } else {
            console.log('unknown trigger from pusher')
        }

    })
        
})

//api routes
app.get('/', (req, res) => res.status(200).send('hello world'))

app.get('/sync', (req, res) => {
    dbModel.find((err, data) =>{
        if (err){
            res.status(500).send(err)
        } else{
            res.status(200).send(data)
        }
    })
})

app.post('/upload', (req, res) => {
    //push a post
    const body = req.body
    dbModel.create(body, (err, data) => {
        if (err){
            res.status(500).send(err)
        } else{
            res.status(201).send(data)
        }
    })

})


//listen
app.listen(port, () => console.log(`listening on localhost:${port}`))