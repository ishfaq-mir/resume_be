require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fs = require("fs/promises");
const nodemailer = require("nodemailer");
const multer = require("multer");
const upload = multer({});
const syfs = require("fs")
const port = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.get("/", (req, res) => {

  const resumeName = req?.query?.resumeName
  if(!resumeName){
    throw new Error("invalid path")
  }
  res.download(`./uploads/${resumeName}`)
});



app.post("/applicants", async (req, res) => {
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
});

app.post("/", upload.single("resume"), async (req, res) => {
  try {
    const fileName = "applicants.csv";
    const header = "firsName,lastName,email,gender,position,qualification,address,experience,download-link\n";

    if (!(await fileExists(fileName))) {
      await fs.appendFile(fileName, header);
    }


    let {originalname,buffer} = req?.file
    const { firstName, email,gender, position, qualification } = req.body;

    if(syfs.existsSync(`./uploads/${originalname}`)){
      const [fn,extension] = originalname.split('.')
      originalname = fn+`_aspl_server_${Math.floor(1000 + Math.random() * 9000)}`+'.'+extension;
    }
   

    let record = `${firstName},{{lastName}},${email},${gender},${position},${qualification},{{address}},{{experience}},http://localhost:3000/?resumeName=${originalname}\n`;
    record = req.body.lastName ? record.replace('{{lastName}}',req.body.lastName) : record.replace('{{lastName}}','');
    record = req.body.address ? record.replace('{{address}}',req.body.address) : record.replace('{{address}}','')
    record = req.body.experience ? record.replace('{{experience}}',req.body.experience):record.replace('{{experience}}',0)
    console.log(record)
    

    await fs.writeFile(`./uploads/${originalname}`,buffer)
    await fs.appendFile("applicants.csv", record);

    // await uploadResume(buffer,originalname)
    res.json({
      status: "success",
      message: "We have received your job application",
    });
  } catch (e) {
    console.log(e)
  }
});



// async function uploadResume(buffer,originalName){
// const https = require('https');
// const fs = require('fs');
// console.log("here is your buffer",buffer)
// console.log("here is your originalName",originalName)

// // const REGION = 'sg'; 
// // const BASE_HOSTNAME = 'storage.bunnycdn.com';
// const HOSTNAME = `sg.storage.bunnycdn.com`
// const STORAGE_ZONE_NAME = 'aspl-candidate-resumes';
// const FILENAME_TO_UPLOAD = originalName;

// // AKfycbwsgtpkanxi3JOTlAKrilJYkF40htgIyKbDKROvejdzpm9AYuQV3GJxL8_blXe5YG5E2A  secondary access key
// const ACCESS_KEY = 'AKfycbwsgtpkanxi3JOTlAKrilJYkF40htgIyKbDKROvejdzpm9AYuQV3GJxL8_blXe5YG5E2A';  //YOUR_BUNNY_STORAGE_API_KEY
// const readStream = buffer
// const options = {
//     method: 'PUT',
//     host: HOSTNAME,
//     path: `/${STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`,
//     headers: {
//       AccessKey: ACCESS_KEY,
//       'Content-Type': 'application/octet-stream',
//     },
//     data:buffer
//   };

//   const req = https.request(options, (res) => {
//     res.on('data', (chunk) => {
//       console.log(chunk.toString('utf8'));
//     });
//   });

//   req.on('error', (error) => {
//     console.error("this is your ERROR ",error);
//   });


// };




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
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: `${process.env.SMTP_USERNAME}`,
      pass: `${process.env.SMTP_PASSWORD}`,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: "mirishfaqhussain007@gmail.com", 
      to: "irfan@smsala.com", 
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
  } catch (e) {
    console.log("Here your Error", e);
  }
}




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
