const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(express.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  username : String,
  userId : String,
  description: String,
  duration: Number,
  date: Date
});

const userModel = mongoose.model('userModel', userSchema);
const exerciseModel = mongoose.model('exerciseModel', exerciseSchema);

app.post('/api/users', async (req, res) => {

  userName = req.body.username;
  let found = await userModel.findOne({username: userName});

  if(found){
    res.json({
      username: found.username,
      _id: found.id
    });
    return;
  }

  let newUser = await userModel.create({username: userName});
        res.json({
          username: newUser.username,
          _id: newUser._id
        });
});

app.post('/api/users/:_id/exercises', (req, res) => {
    let {description, duration, date} = req.body;
    date = new Date(date);
    if(date.toString() === 'Invalid Date'){
      date = new Date();
    }
    
    userModel.findById({_id: req.params._id})
             .then((user) => {
                 let newExercise = new exerciseModel({
                   username: user.username,
                   userId : user._id,
                   description: description,
                   duration: duration,
                   date: date
                 })

                 newExercise.save()
                            .then((data) => res.json({
                              username: data.username,
                              _id: data.userId,
                              description: data.description,
                              duration: data.duration,
                              date: data.date.toDateString()
                            }))
               .catch((err) => console.log(err))
                     
             })
            .catch((err) => console.log(err));
});

app.get('/api/users', async (req, res) => {
  let users = await userModel.find();
  let arr = [];
  for (const user of users)
    arr.push({username: user.username, _id: user._id});

  res.send(arr);
  
});

app.get('/api/users/:_id/logs', async (req, res) =>{
  let {from, to, limit} = req.query;
  let user = await userModel.findById(req.params._id);
  let filter = {userId: req.params._id};
  let dateFilter = {};
  if(from){
     dateFilter['$gte'] = new Date(from);
  }
  if(to){
     dateFilter['$lte'] = new Date(to);
  }
  else{
    dateFilter['$lte'] = new Date();
  }
  if(from){
    filter.date = dateFilter
  }
  if(!limit){
    limit = 1000
  }
  
  let data = await exerciseModel.find(filter).
                                 limit(limit);
  let logData = data.map((item) => {
    return {
      description: item.description,
      duration: item.duration,
      date: item.date.toDateString()
    };
  })
  
  res.json({
    username: user.username,
    _id: user._id,
     count: data.length,
    log: logData
  });
});

  
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

