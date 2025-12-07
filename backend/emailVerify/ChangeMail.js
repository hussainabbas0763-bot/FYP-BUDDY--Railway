import nodemailer from "nodemailer"
import 'dotenv/config'
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import handlebars from "handlebars"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const sendChangeMail = async (otp, newEmail) => {

    const emailTemplateSource = fs.readFileSync(
        path.join(__dirname, "ChangeEmailTemplate.hbs"),
        "utf-8"
    )

    const template = handlebars.compile(emailTemplateSource)
    const htmlToSend = template({ otp: encodeURIComponent(otp) })

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    })

    const mailConfigurations = {
        from: process.env.MAIL_USER,
        to: newEmail,
        subject: 'Register New Email Address',
        html: htmlToSend,
    }

    transporter.sendMail(mailConfigurations, function (error, info) {
        if (error) {
            throw new Error(error)
        }


    })
}