import { userModel } from "../../../databases/modeles/user.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import bcrypt from 'bcrypt'
import jwt  from 'jsonwebtoken'
import { sendToEmail } from "../mails/sendEmail.js";
import { htmlResetPassword } from "../mails/templete2.js";
import { template4 } from "../mails/templete4.js";
import { template3 } from "../mails/templete3.js";
import { createTransport } from "nodemailer";
import cloudinary from "../cloudinary/cloudinary.js";

const signUp =catchAsyncError(async (req,res,next)=>{
    const gmail =await userModel.findOne({email:req.body.email})
    if(gmail) return next(new AppError("Account Already Exist",403))
    if(req.file){
        const result =await cloudinary.uploader.upload(req.file.path,
            {
                folder: 'uploads/user',
                public_id: `${Date.now()}`, // Optional: specify a custom public_id
                resource_type: "auto"
            })

        req.body.imgCover =result.url
    }
    req.body.fullname =req.body.firstname +" "+ req.body.lastname
    const user =new userModel(req.body)
    await user.save()
    sendToEmail({email:req.body.email})
    res.json({message:"success",user})
})

const signIn=catchAsyncError(async (req,res,next)=>{
    const {email,password}=req.body
    const user =await userModel.findOne({email})
    if(!user) return next(new AppError("Account Not Found",401))
    if(!(await bcrypt.compare(password, user.password))) return next(new AppError("Password Wrong",403))

    if(!user.confrimEmail) return next(new AppError("Please Verfiy Your Email and Login Again"))
    let token = jwt.sign({ email:user.email ,userId:user._id ,firstname:user.firstname,lastname:user.lastname,fullname:user.fullname}, process.env.KEY_SEQERT_SIGN);
    res.json({message:"success",user,token})
})

const verfiyEmail =catchAsyncError(async (req,res,next)=>{
    const {token}=req.params
    jwt.verify(token, process.env.KEY_SEQERT_VERFIY,async function(err, decoded) {
       if(err) return next(new AppError("Not Verfiy Token"))
        await userModel.findOneAndUpdate({email:decoded.email},{confrimEmail:true})
        res.status(200).send(template4());
      });
})
const sendToEmailAgain =catchAsyncError(async(req,res,next)=>{
    const {email}=req.body
    const user =await userModel.findOne({email})
  if(user && !user.confrimEmail){
   await sendToEmail({email:req.body.email})
    res.json({message:"Success And Check In Your Email"})
  }else{
    next(new AppError("Check In Your Data",403))
  }
  
})

const updateDate =catchAsyncError(async (req,res,next)=>{
    if(req.body.firstname ||req.body.lastname){
        req.body.fullname =(req.body.firstname ||req.user.firstname) +" "+ (req.body.lastname ||req.user.lastname)
    }
    if(req.file){
        const result =await cloudinary.uploader.upload(req.file.path,
            {
                folder: 'uploads/user',
                public_id: `${Date.now()}`, // Optional: specify a custom public_id
                resource_type: "auto"
            })

        req.body.imgCover =result.url
    }
    const user =await userModel.findById(req.user._id)
    if(!user) return next(new AppError("Not Valid Email",403))
    const newUpdate =await userModel.findByIdAndUpdate(req.user,req.body,{new:true})
    res.json({message:"success",newUpdate})
})
const changePassword =catchAsyncError(async (req,res,next)=>{
    const {newPassword,oldPassword}=req.body
    const user =await userModel.findById(req.user._id)
    if(!user) return next(new AppError("Not Valid Email",403))
    if(!oldPassword) return next(new AppError("please Enter Old Password",403))
    if(!(await bcrypt.compare(oldPassword, user.password)))  return next(new AppError("Password That You Enter is Wrong"))
    const newUpdate =await userModel.findByIdAndUpdate(req.user,{password:newPassword},{new:true})
    res.json({message:"success",newUpdate})
})



const getUser =catchAsyncError(async (req,res,next)=>{
    const user =await userModel.findById(req.user._id)
    if(!user) return next(new AppError("User Not Found" ,403))
    res.json({message:"success",user})
})

const logout =catchAsyncError(async (req,res,next)=>{
    req.body.logout =Date.now()
    const user =await userModel.findByIdAndUpdate(req.user._id,req.body,{new:true})
    res.json({message:"Your Are loged out"})
})

const removeAccount =catchAsyncError(async(req,res,next)=>{
    const user =await userModel.findByIdAndDelete(req.user._id)
    res.json({message:"Account Deleted ."})
})
let forgetPassword = catchAsyncError(async (req, res) => {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(404).json({message:'User not found'});
    }

    let token = jwt.sign({ email: email }, process.env.KEY_SEQERT_RESET)
    // Create a Nodemailer transporter
    const transporter = createTransport({
        service: 'gmail',
        auth: {
            user: "mohamedmashhour874@gmail.com",
            pass: process.env.PASSWORD_GMAIL,
        },
    });


    // Send password reset email
    const mailOptions = {
        from: '"Mohamed 👻" <mohamedmashhour874@gmail.com>',
        to: email,
        subject: 'Password Reset ✔',
        html: htmlResetPassword(token),
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({message:'Error sending email' + error});
        }
        res.status(200).json({message:'Password reset email sent'});
    });

})

let changeResetPassword = catchAsyncError(async (req, res) => {
    const { token } = req.params;
    res.send(template3(token));
})

let resetPassword = catchAsyncError(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    jwt.verify(token, process.env.KEY_SEQERT_RESET, async (err, decode) => {
        if (err) return res.json({ message: err })

        let user = await userModel.findOne({ email: decode.email });
        if (!user) {
            return res.status(404).json({message:'Email Not Found'});
        }
        // Update the user's password and clear the resetToken
        await userModel.findOneAndUpdate({ email: decode.email }, { password },{new:true})
        res.status(200).send(template4());

    })
})



export {
    signUp ,
    signIn ,
    verfiyEmail ,
    updateDate ,
    changePassword ,
    getUser ,
    logout ,
    removeAccount ,
    sendToEmailAgain ,
    resetPassword ,
    changeResetPassword ,
    forgetPassword
}