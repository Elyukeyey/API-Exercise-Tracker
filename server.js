const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ids = require('shortid');
const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
});
const ObjectID = mongoose.Schema.Types.ObjectId;


app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// custom functions
const genID = (len = 9) => `${Math.random().toString(36).substr(2, len)}`;
const parseDate = (d) => {
  let date = new Date(d);
  date = date.toString().split(' ');
  console.log(date);
  return `${date[1]} ${date[2]} ${date[3]}`;
}

// Models

const UserSchema = new mongoose.Schema({
  _id: String,
  username: { type: String, unique: true }
});
const ExerSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: String
});

const Users = mongoose.model('Users', UserSchema);
const Exercises = mongoose.model('Exercises', ExerSchema);


// POST REQUEST

app.post('/api/exercise/new-user', (req, res) => {
  // req.body.username
  console.log(req.body);
  let newId = genID(6);
  console.log(newId);
  let newUser = new Users({_id: newId, username: req.body.username});
  newUser.save((err,data)=>{
    if(err) {
      res.json(err);
    } else {
      let find = Users.findOne({username: req.body.username});
      find.exec()
      .then(data=>res.json({username: data.username, _id: data._id}));
    }
  });
});

app.post('/api/exercise/add',(req,res)=>{
  // userId
  //description
  //duration parseInt()
  //date:
  let {userId, description, duration, date} = req.body;
  console.log(req.body);
  console.log(parseDate(date));
  let addExer = new Exercises({
    userId: userId,
    description: description,
    duration: parseInt(duration),
    date: date
  });
  addExer.save((err,data)=>{
    if (err) {
      res.json(err);
    } else {
      let find = Exercises.findOne({userId: userId, date: date});
      find.exec()
      .then(data =>res.json({
        userId: data.userId,
        description: data.description,
        duration: data.duration,
        date: data.date
      }))
      .catch(err=>res.json(err));
    }
  })
});


// GET REQUEST
// req.query
app.get('/api/exercise/log',(req,res)=>{
// get query 
  let findUser, qLimit;
  const { userId, from, to, limit } = req.query;
  
  (limit) ? qLimit = parseInt(limit) : qLimit = 0;
  
  let returnData = `description duration date`;
  
  let findUserId = Exercises.find({userId: userId }, returnData);
  let findUserIdByDate = Exercises.find({"userId": userId, "date": { "$gte": from, "$lte": (to) ? to : false }}, returnData);
  
  (from) ? findUser = findUserIdByDate : findUser = findUserId; 
  
  findUser.limit(qLimit).exec()
    .then(data => res.json(data))
    .catch(err=>res.json({error: err.message, err: err.code}));
//
});

// listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

