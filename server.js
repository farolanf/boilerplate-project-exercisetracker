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

function isDate(str) {
  return !!str && /^\s*\d{4}-\d{2}-\d{2}\s*$/.test(str)
}

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
    (!req.body.date || !isDate(req.body.date))
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
      res.json(_.pick(data, ['_id', 'userId', 'description', 'duration', 'date']))
    })
  })
})

app.get('/api/exercise/log', (req, res) => {
  if (!req.query.userId || req.query.userId.trim() === '') return res.sendStatus(400)
  
  User.findById(req.query.userId, (err, user) => {
    if (err) return res.sendStatus(500)
    if (!user) return res.sendStatus(404)
    
    const from = isDate(req.query.from) && new Date(req.query.from)
    const to = isDate(req.query.to) && new Date(req.query.to)
    const query = {}
    
    if (from) {
      query.date = { $gte: from }
    }
    if (to) {
      query.date = {}
      query.date.$lte = to
    }

    let q = Exercise.find(query)
    
    if (req.query.limit) {
      q = q.limit(parseInt(req.query.limit))
    }
    
    q.exec((err, exercises) => {
      if (err) return res.status(500).send(err)
      
      res.json({
        _id: user._id,
        username: user.username,
        count: exercises.length,
        log: exercises.map(e => {
          const obj =_.pick(e, ['description', 'duration'])
          obj.date = e.date.toDateString()
          return obj
        })
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
