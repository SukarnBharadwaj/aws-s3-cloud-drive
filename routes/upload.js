const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const router = express.Router();

// Middleware to check login
const requireLogin = (req, res, next) => {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }
    next();
};

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4',
});

// Upload page
router.get('/', requireLogin, (req, res) => {
    res.send(`
        <h1 style="font-family: 'Courier New', Courier, monospace;">Upload File to S3</h1>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="file" required />
            <button type="submit">Upload</button>
        </form>
        <a href="/list">View Uploaded Files</a><span> | </span>
        <a href="/logout">Logout</a>
    `);
});

// Handle file upload
router.post('/', requireLogin, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).send('No file uploaded.');
        }

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `drive-files/${path.basename(file.originalname)}`,
            Body: file.buffer,
        };

        const uploadResult = await s3.upload(params).promise();
        // res.json({
        //     message: 'File uploaded successfully',
        //     location: uploadResult.Location,
        // });
        res.send(`
            <h1>File uploaded successfully</h1>
            <p>File location: <a href="${uploadResult.Location}">${uploadResult.Location}</a></p>
            <a href="/upload">Upload Another File</a><span> | </span>
            <a href="/list">View Uploaded Files</a><span> | </span>
            <a href="/logout">Logout</a>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading file.');
    }
});

module.exports = router;
