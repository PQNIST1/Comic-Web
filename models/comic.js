const mongoose = require("mongoose");

const comicSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 0 
  },
  image: {
    type: [String],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  category: {
    type: [String],
    required: true
  },
  chapters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter"
    },
  ],
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  ageRating: {
    type: String,
    required: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastChapterAddedAt: { type: Date, default: null },
});

module.exports = mongoose.model('Comic', comicSchema);
