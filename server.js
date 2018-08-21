const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
const _ = require('lodash')

const { User, Exercise } = require('./models')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))

// API

app.post('/api/exercise/new-user', (req, res) => {
  if (!req.body.username || req.body.username.trim() === '') {
    return res.sendStatus(400)
  }
  User.create({ username: req.body.username }, (err, user) => {
    if (err) res.sendStatus(500)
    res.json(_.pick(user, ['_id', 'username']))
  })
})

app.post('/api/exercise/add', (req, res) => {
  if (
    (!req.body.userId || req.body.userId.trim() === '') ||
    (!req.body.description || req.body.description.trim() === '') ||
    (!req.body.duration || req.body.duration.trim() === '' || req.body.duration.trim() == 0) ||
    (!req.body.date || !/^\s*\d{4}-\d{2}-\d{2}\s*$/.test(req.body.date))
  ) {
    return res.sendStatus(400)
  }
  User.findOne({ _id: req.body.userId }, (err, user) => {
    if (err) return res.sendStatus(500)

    Exercise.create({
      userId: user._id,
      description: req.body.description.trim(),
      duration: parseInt(req.body.duration.trim()),
      date: new Date(req.body.date.trim())
    }, (err, data) => {
      if (err) res.sendStatus(500)
      res.json({
        _id: data._id,
        username: user.username,
        description: data.description,
        duration: data.duration,
        date: data.date.toDateString()
      })
    })
  })
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
