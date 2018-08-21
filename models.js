const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
})

const User = mongoose.model('User', userSchema)

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
})

const Exercise = mongoose.model('Exercise', exerciseSchema)

module.exports = {
  User,
  Exercise
}