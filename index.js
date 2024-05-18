import express from 'express'
import { AppError } from './src/utils/AppError.js'
import { dbconnection } from './databases/dbconnection.js'
import cors from 'cors'
import userRouter from './src/modules/auth/auth.router.js'
import dotenv from 'dotenv'
import messageRouter from './src/modules/message/message.router.js'
import compression from 'compression'
import emotionsRouter from './src/modules/emotion/emotion.router.js'


const app =express()

dotenv.config()
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('uploads/user'))
app.use(cors())


app.use('/users',userRouter)
app.use('/message',messageRouter)
app.use('/emotions',emotionsRouter)



app.all('*',(req,res,next)=>{
    next(new AppError("Page Not Found "+req.originalUrl ,404))
})
app.use((err,req,res,next)=>{
    let code =err.statusCode || 403
    res.status(code).json({message:err.message})
})

dbconnection()
app.listen(process.env.PORT||5001,()=>{
    console.log("Server is Running ...");
})