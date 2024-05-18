import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref:'user' ,
    required: true,
  },
  emotion: {
    type: String,
    required: true,
    enum: ['Happy', 'Neutral', 'Calm','Sad','Angry','Fear','Disgust','Surprise'], // قائمة بالمشاعر المسموح بها
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export const Record = mongoose.model('Record', recordSchema);