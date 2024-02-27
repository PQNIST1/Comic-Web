const mongoose = require('mongoose');

const followedComicSchema = new mongoose.Schema({
  comic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comic'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readingHistory: [
    {
      comic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comic'
      },
      chapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter'
      },
      lastReadAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  followedComics:  [followedComicSchema],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
