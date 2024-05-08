require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fs = require("fs/promises");
const nodemailer = require("nodemailer");
const multer = require("multer");
const upload = multer({});
const syfs = require("fs")
const httpException = require("http-exception")

const recaptcha = require('express-recaptcha');
// const compression = require("compression");
// const helmet = require("helmet");

recaptcha.init('6LeOnNUpAAAAABg2f6feCoDAsmNF7vlLOtmRTscY', '6LeOnNUpAAAAACHIWxIyagDALV5QK_7lklVEl8C0'); 
var cors = require('cors')

const port = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(compression()); 
// app.use(helmet());



// { origin: 'http://127.0.0.1:5500' }
app.use(cors())

app.get("/test", (req, res) => {

  const resumeName = req?.query?.resumeName
 res.json({status:"success"})
});


app.get("/", (req, res) => {

  const resumeName = req?.query?.resumeName
  if(!resumeName){
    throw new Error("invalid path")
  }
  res.download(`./uploads/${resumeName}`)
});



app.post("/applicants", async (req, res,next) => {

  try{
    const { userName, secret } = req.body;
    if (
      userName === process.env.HR_USERNAME &&
      secret === process.env.HR_SECRET
    ) {
      await mailToHr();
      res.json({ status: "success", message: "check your inbox" });
    } else {
      throw new Error("Your credentials are wrong");
    }
  }
  catch(error){

    res.status(401).json({ status: "error", message: error.message });

  }
  
});

app.post("/", upload.single("resume"),recaptcha.middleware.verify, async (req, res,next) => {

  //   if (!req.recaptcha.error) {
  //     // reCAPTCHA verification successful
  //     // Handle form submission logic here
  //     res.send('Form submitted successfully!');
  // } else {
  //     // reCAPTCHA verification failed
  //     res.status(400).send('reCAPTCHA verification failed');
  // }

  if(recaptcha.recaptcha.error){
    const fileName = "applicants.csv";
    const header = "fullName,phone,email,gender,position,qualification,address,experience,download-link\n";

    const recaptchaToken = req.body['g-recaptcha-response'];

    console.log("this is recaptcha token",recaptchaToken)

   
    const secretKey = "6LeOnNUpAAAAACHIWxIyagDALV5QK_7lklVEl8C0" 
    
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken[1]}`;
    
      const response = await fetch(verificationUrl, { method: 'POST' });
      const responseData = await response.json();
      console.log("responseData",responseData)
   
      console.log(error)


    let {originalname,buffer,size} = req?.file
    const { fullName,phone, email,gender, position, qualification } = req.body;
    const validExtenstions = ['pdf','doc','docx']
    const [fn,ext] = originalname.split('.')

    if(size> 5 * 1024 * 1024){
      throw new Error("Your resume file has exceeded the 5MB Limit")  
    }

    if(!validExtenstions.includes(ext)){

      throw new Error("Invalid extention file")

    }

    if(!fullName){
      throw new Error("full name is missing")
    }

    if(!email){
      throw new Error("email is missing")
    }

    if(!gender){
      throw new Error("gender is missing")
    }

    if(!position){
      throw new Error("position is missing")
    }

    if(!qualification){
      throw new Error("qualification is missing")
    }

    if(phone.length>10){
      throw new Error ("Invalid phone number")

    }

    if (!(await fileExists(fileName))) {
      await fs.appendFile(fileName, header);
    }

    if(syfs.existsSync(`./uploads/${originalname}`)){
      const [fn,extension] = originalname.split('.')
      originalname = fn+`_aspl_server_${Math.floor(1000 + Math.random() * 9000)}`+'.'+extension;
    }
   

    let record = `${fullName},${phone},${email},${gender},${position},${qualification},{{address}},{{experience}},${process.env.BASE_URL}?resumeName=${originalname}\n`;
    record = req.body.address ? record.replace('{{address}}',req.body.address) : record.replace('{{address}}','')
    record = req.body.experience ? record.replace('{{experience}}',req.body.experience) : record.replace('{{experience}}',0)
    
    await fs.writeFile(`./uploads/${originalname}`,buffer)
    await fs.appendFile("applicants.csv", record);

    res.json({
      status: "success",
      message: "We have received your job application",
    });

  }
  else{
    console.log("error")
  }
    
  
});


async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}



async function mailToHr() {
  const transporter = nodemailer.createTransport({
    host: "mail.asmsc.net",
    port: 25,
    secure: false, 
    auth: {
      // user: `${process.env.SMTP_USERNAME}`,
      // pass: `${process.env.SMTP_PASSWORD}`,
      user: `noreply`,
      pass: `Irfan@786#`,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

 
    const info = await transporter.sendMail({
      from: "noreply@asmsc.net", 
      to: "ishfaqmir@almuqeet.systems", 
      subject: "Greetings from the app Hr", 
      text: "This is mars", 
      html: ` <p>Hi Hr,</p>
    <p>Attached is the Excel file containing candidates who've applied for our open positions. Please review at your convenience.</p>
    <p>Let me know if you need any further assistance.</p>
    <p>Best Regards,<br>
    Team Digital Marketing</p>`, 
      attachments: [
        {
          filename: "applicants.csv", 
          path: "./applicants.csv", 
        },
      ],
    });

    console.log("Message sent: %s", info.messageId);
 
}




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
