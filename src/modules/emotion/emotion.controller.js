import { Record } from "../../../databases/modeles/statusHuman.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import axios from "axios";
import FormData from "form-data";
import fs from 'fs';
const enterRecord = catchAsyncError(async (req, res ,next) => {
  req.body.userId =req.user._id
const baseUrl ='http://ec2-34-200-78-89.compute-1.amazonaws.com:8000/predict'
const form = new FormData();
form.append('file',fs.createReadStream(req.file.path))
const response = await axios.post(baseUrl, form,{
   'Content-Type': 'multipart/form-data',
})
const emotion=response.data.result
    const record = new Record({ userId:req.body.userId,emotion, date: new Date() });
    await  record.save();
    res.status(200).json({message:"success",emotion ,record})
  }
  )

const enterEmotions=catchAsyncError(async (req,res,next)=>{
  const {emotion}=req.body
  const record = new Record({ userId:req.user._id,emotion, date: new Date() });
  await  record.save();
  res.status(200).json({message:"success",emotion })
})

const getHistoryDay =catchAsyncError( async (req, res,next) => {
   
   let {userId}  = req.params;
   if(!userId || userId != req.user._id){
    return next(new AppError("not authorized",401))
   }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
  
      const emotions = await Record.aggregate([
        {
          $match: {
            userId,
            date: { $gte: startOfDay },
          },
        },
        {
          $group: {
            _id: '$emotion',
            count: { $sum: 1 },
          },
        },
      ]);
  
      const dailyData = {
        Neutral: 0,
        Calm: 0,
        Happy: 0,
        Sad: 0,
        Angry: 0,
        Fear: 0,
        Disgust: 0,
        Surprise: 0
      };
      emotions.forEach((emotion) => {
        dailyData[emotion._id] = emotion.count;
      });
  
      res.status(200).json({ Day: dailyData });
   
  })

  const getHistoryWeek = catchAsyncError(async (req, res,next) => {
    let {userId}  = req.params;
    if(!userId || userId != req.user._id){
     return next(new AppError("not authorized",401))
    }
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 1) % 7);
  
  
    const weeklyData = {};
  
    for (let i = 0; i < 7; i++) {
    
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
  
      const emotions = await Record.aggregate([
        {
          $match: {
            userId,
            date: { $gte: currentDate, $lt: new Date(currentDate.getTime() + 86400000) },
          },
        },
        {
          $group: {
            _id: '$emotion',
            count: { $sum: 1 },
          },
        },
      ]);
  
      const dailyData = {
        Neutral: 0,
            Calm: 0,
            Happy: 0,
            Sad: 0,
            Angry: 0,
            Fear: 0,
            Disgust: 0,
            Surprise: 0
      };
  
      emotions.forEach((emotion) => {
        dailyData[emotion._id] = emotion.count;
      });
  
      weeklyData[currentDate.toLocaleDateString('en-US', { weekday: 'long' })] = dailyData;
    }
  
    res.status(200).json({ Week: weeklyData });
  });


  const getHistoryMonth = catchAsyncError(async (req, res) => {

    // const userId = req.user._id;
    const { userId } = req.params;
  
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
  
    const monthlyData = {};
  
    for (let i = 0; i < 4; i++) {
      const startOfWeek = new Date(startOfMonth);
      startOfWeek.setDate(startOfMonth.getDate() + i * 7);
  
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);
  
      const emotions = await Record.aggregate([
        {
          $match: {
            userId,
            date: {
              $gte: startOfWeek,
              $lt: endOfWeek,
            },
          },
        },
        {
          $group: {
            _id: '$emotion',
            count: { $sum: 1 },
          },
        },
      ]);
  
      const weeklyData = {
        Neutral: 0,
        Calm: 0,
        Happy: 0,
        Sad: 0,
        Angry: 0,
        Fear: 0,
        Disgust: 0,
        Surprise: 0,
      };
  
      emotions.forEach((emotion) => {
        weeklyData[emotion._id] = emotion.count;
      });
      monthlyData[`Week ${i + 1}`] = weeklyData;
    }
  
    res.status(200).json({ Month: monthlyData });
  });

const getHistoryYear = catchAsyncError(async (req, res) => {
  let {userId}  = req.params;
  if(!userId || userId != req.user._id){
   return next(new AppError("not authorized",401))
  }
  const startOfYear = new Date();
  startOfYear.setMonth(0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const yearlyData = {};

  for (let i = 0; i < 12; i++) {
    const currentMonth = new Date(startOfYear);
    currentMonth.setMonth(startOfYear.getMonth() + i);

    const emotions = await Record.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
            $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: '$emotion',
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyData = {
      Neutral: 0,
      Calm: 0,
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Fear: 0,
      Disgust: 0,
      Surprise: 0
    };

    emotions.forEach((emotion) => {
      monthlyData[emotion._id] = emotion.count;
    });

    yearlyData[currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })] = monthlyData;
  }

  res.status(200).json({ Year: yearlyData });
});


export {
    enterRecord ,
    enterEmotions ,
    getHistoryDay ,
    getHistoryMonth ,
    getHistoryWeek ,
    getHistoryYear
}
