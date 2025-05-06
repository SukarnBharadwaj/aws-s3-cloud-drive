const express = require('express');
const session = require('express-session');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Setup session
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'default_secret',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4',
});

// Build step: List all files and folders in the S3 bucket
async function buildStep() {
    console.log('Starting the build step...');

    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Delimiter: '/', // Groups items into folders
        };

        const data = await s3.listObjectsV2(params).promise();

        console.log('Folders:');
        if (data.CommonPrefixes && data.CommonPrefixes.length > 0) {
            data.CommonPrefixes.forEach((folder) => {
                console.log(`- ${folder.Prefix}`);
            });
        } else {
            console.log('No folders found.');
        }

        console.log('Files:');
        if (data.Contents && data.Contents.length > 0) {
            data.Contents.forEach((file) => {
                console.log(`- ${file.Key}`);
            });
        } else {
            console.log('No files found.');
        }

        console.log('Build step completed successfully.');
        process.exit(0); // Exit the app after the build step
    } catch (error) {
        console.error('Error during the build step:', error);
        process.exit(1); // Exit with an error code on failure
    }
}

// Check for build mode
if (process.argv.includes('--build')) {
    buildStep(); // Run the build step and exit
} else {
    // Load routes if not in build mode
    const loginRoutes = require('./routes/login');
    const uploadRoutes = require('./routes/upload');
    const listRoutes = require('./routes/list');
    const login = require('./routes/loginex');

    app.use('/', loginRoutes);
    app.use('/upload', uploadRoutes);
    app.use('/list', listRoutes);

    // Start the server
    app.listen(port, () => {
        console.log(`Server running on port ${port}, access at http://localhost:${port}`);
    });
}
