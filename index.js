const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const admin = require('firebase-admin');
const fileUpload = require('express-fileupload');



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qxxep.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;



const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('services'));
app.use(fileUpload());



var serviceAccount = require("./creative-it-assignment-firebase-adminsdk-wqx5t-d69d8acc8c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://creative-it-assignment.firebaseio.com"
});

const port = 9000;

app.get('/',(req, res)=>{
    res.send("working")
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const orderCollection = client.db("Creative-IT").collection("orders");


  app.post('/addAOrder',(req, res)=>{
    const photo = req.files.photo;
    const name = req.body.name;
    const email = req.body.email;
    const projectName = req.body.projectName;
    const price = req.body.price;
    const details = req.body.details;
    const photoPath = `${__dirname}/placedOrders/${photo.name}`
  
  
    photo.mv(photoPath , err=> {
      if (err) {
        console.log(err);
        return res.status(500).send({msg: 'Failed to upload image'})
      }
      const newPhoto = fs.readFileSync(photoPath);
      const encPhoto =newPhoto.toString('base64');
  
      var imageOne = {
        contentType : req.files.photo.mimetype,
        size: req.files.photo.size,
        img: Buffer(encPhoto, 'base64')
      };
  
  
      orderCollection.insertOne({name, email, projectName, price, details, imageOne})
      .then(outCome => {
        fs.remove(photoPath, error => {
          if (error) {console.log(error)}
          res.send(outCome.insertedCount > 0)
        })
      })
    })
  });
  


  app.get('/orders',(req, res)=>{
    const bearer = req.headers.authorization;
      if(bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1];
          admin.auth().verifyIdToken(idToken)
            .then(function(decodedToken) {
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            if (tokenEmail == queryEmail) {
                orderCollection.find({email : queryEmail})
                .toArray((err,documents) => {
                    res.send(documents);
                })
            }
            })
            .catch(function(error) {
                res.send('Un-authorized access')
            });
      }
     else{
         res.send('Un-authorized access')
     }

  });

  app.get('/ordersList',(req, res)=>{
    orderCollection.find()
    .toArray((err,documents) =>{
        res.send(documents)
    })
  });



});

  client.connect(err => {
    const reviewCollection = client.db("Creative-IT").collection("reviews");

  app.post('/addAReview',(req, res)=>{
    const review = req.body;
    reviewCollection.insertOne(review)
    .then(result =>{
        res.send(result.insertedCount > 0)
    })
  });

  app.post('/reviews',(req, res)=>{
    reviewCollection.find({})
    .toArray((err,documents) =>{
        res.send(documents)
    })
  });


});


client.connect(err => {
    const serviceCollection = client.db("Creative-IT").collection("services");


  app.get('/services',(req, res)=>{
  serviceCollection.find({})
  .toArray((err,documents) =>{
      res.send(documents)
  })
});

app.post('/addAService',(req, res)=>{
  const file = req.files.file;
  const title = req.body.title;
  const description = req.body.description;
  const filePath = `${__dirname}/services/${file.name}`


  file.mv(filePath , err=> {
    if (err) {
      console.log(err);
      return res.status(500).send({msg: 'Failed to upload image'})
    }
    const newImg = fs.readFileSync(filePath);
    const encImg =newImg.toString('base64');

    var image = {
      contentType : req.files.file.mimetype,
      size: req.files.file.size,
      img: Buffer(encImg, 'base64')
    };


    serviceCollection.insertOne({title, description, image})
    .then(result => {
      fs.remove(filePath, error => {
        if (error) {console.log(error)}
        res.send(result.insertedCount > 0)
      })
    })
  })
});


});



client.connect(err => {
    const adminCollection = client.db("Creative-IT").collection("admins");

  app.post('/addAdmin',(req, res)=>{
    const admin = req.body;
    adminCollection.insertOne(admin)
    .then(result =>{
        res.send(result.insertedCount > 0)
    })
  });

  app.get('/admins',(req, res)=>{
    adminCollection.find({})
  .toArray((err,documents) =>{
      res.send(documents)
  })
});


app.post('/isAdmin', (req, res) => {
  const email = req.body.email;
  adminCollection.find({email: email})
  .toArray((err, admins) => {
    res.send(admins.length > 0)
  })
})


});





app.listen(process.env.PORT || port)