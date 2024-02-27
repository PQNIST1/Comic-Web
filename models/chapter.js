const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
    chapterNumber: {
      type: Number,
      default: 1
    },
    title: {
      type: String,
      required: true
    },
    pages: [String],
    views: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    comic:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comic"
    },
  });

module.exports = mongoose.model('Chapter', chapterSchema);
