import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { html } from './html.js';


export const sendToEmail = async (options) => {
 const   transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "mohamedmashhour874@gmail.com",
            pass: process.env.PASSWORD_GMAIL,
        },
    });
    let token = jwt.sign({ email: options.email }, process.env.KEY_SEQERT_VERFIY)
    const info = await transporter.sendMail({
        from: '"Mohamed 👻" <mohamedmashhour874@gmail.com>', 
        to: options.email, 
        subject: "Confirm Your Email ✔",
        html: html(token), 
    });
}
