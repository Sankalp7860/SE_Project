const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Plain text password
  },
  { timestamps: true }
);

module.exports = mongoose.model('Test', userSchema);
