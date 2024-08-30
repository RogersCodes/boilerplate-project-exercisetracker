const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
 //userSchema
 const Schema = mongoose.Schema;
 const userSchema = new mongoose.Schema({
  username: {type: String, required: true}
 })
 let userModel = mongoose.model("user", userSchema);

 //exerciseSchema
 const exerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: new Date()}
 })
let exerciseModel = mongoose.model("exercise", exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use('/', bodyParser.urlencoded({ extended: false }));

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let newUser = userModel({username: username});
  newUser.save();
  res.json(newUser);
})

app.get('/api/users', (req, res) => {
  userModel.find({}).then((users)=> {
    res.json(users);
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  console.log(req.body);
  let userId = req.params._id;
  let exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration
  }
  if (req.body.date != '') {
    exerciseObj.date = req.body.date
  }
  let newExercise = new exerciseModel(exerciseObj);
  
  userModel.findById(userId)
  .then(userFound => {
    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    newExercise.save();
    res.json({
      _id: userFound._id,
      username: userFound.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString()
    });
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  });

});

app.get('/api/users/:_id/logs', (req, res) => {
  let userId = req.params._id;
  let { from, to, limit } = req.query; // Extract the query parameters from the request

  userModel.findById(userId)
    .then(userFound => {
      if (!userFound) {
        return res.status(404).json({ error: 'User not found' });
      }

      let responseObj = {
        _id: userFound._id,
        username: userFound.username
      };

      // Build the query object for filtering exercises
      let query = { userId: userId };
      if (from || to) {
        query.date = {};
        if (from) {
          query.date.$gte = new Date(from);
        }
        if (to) {
          query.date.$lte = new Date(to);
        }
      }

      // Find exercises with the query and apply limit if provided
      exerciseModel.find(query).limit(parseInt(limit)).then((exercises) => {
        exercises = exercises.map((x) => {
          return {
            description: x.description,
            duration: x.duration,
            date: x.date.toDateString()
          };
        });

        responseObj.log = exercises;
        responseObj.count = exercises.length;
        res.json(responseObj);
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: 'Server error' });
    });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
