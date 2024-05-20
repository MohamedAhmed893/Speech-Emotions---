import express from 'express'
import * as Emotions from './emotion.controller.js'
import { auth } from '../../middleware/authentication.js'
import { uploadFile } from '../../middleware/uploadfile.js'

const emotionsRouter = express.Router()

emotionsRouter.post('/enter-record',auth,uploadFile('file','audios'),Emotions.enterRecord)
emotionsRouter.post('/enter-emotion',auth,Emotions.enterEmotions)
emotionsRouter.get('/history/day/:userId',auth,Emotions.getHistoryDay)
emotionsRouter.get('/history/month/:userId',auth,Emotions.getHistoryMonth)
emotionsRouter.get('/history/week/:userId',auth,Emotions.getHistoryWeek)
emotionsRouter.get('/history/year/:userId',auth,Emotions.getHistoryYear)


export default emotionsRouter
