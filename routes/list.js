const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

// Middleware to check login
const requireLogin = (req, res, next) => {
    if (!req.session.loggedIn) {
        return res.redirect('/');
    }
    next();
};

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4',
});

// List files and folders in bucket
router.get('/', requireLogin, async (req, res) => {
    try {
        const prefix = req.query.prefix || ''; // If prefix is specified, use it; otherwise, list root level

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: prefix, // Filter items based on the prefix
            Delimiter: '/', // Delimit items by "folders"
        };

        const data = await s3.listObjectsV2(params).promise();

        let html = '<h1>Uploaded Files and Folders</h1><ul>';

        // Display folders (common prefixes)
        if (data.CommonPrefixes && data.CommonPrefixes.length > 0) {
            data.CommonPrefixes.forEach((folder) => {
                const folderName = folder.Prefix.replace(prefix, '').replace(/\/$/, '');
                html += `<li>
                    <strong>[Folder]</strong> ${folderName} 
                    <a href="/list?prefix=${encodeURIComponent(folder.Prefix)}">Open</a>
                </li>`;
            });
        }

        // Display files
        if (data.Contents && data.Contents.length > 0) {
            data.Contents.forEach((file) => {
                if (file.Key !== prefix) { // Skip the folder itself if it appears
                    const fileName = file.Key.replace(prefix, '');
                    html += `<li>
                        ${fileName} 
                        <a href="/list/download?file=${encodeURIComponent(file.Key)}">Download</a>
                    </li>`;
                }
            });
        }

        html += '</ul>';
        if (prefix) {
            const parentPrefix = prefix
                .split('/')
                .slice(0, -2)
                .join('/') + '/';
            html += `<a href="/list?prefix=${encodeURIComponent(parentPrefix)}">Go Back</a>`;
        } else {
            html += `<a href="/upload">Back to Upload</a>`;
        }

        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving files and folders.');
    }
});

// Download file
router.get('/download', requireLogin, async (req, res) => {
    try {
        const fileKey = req.query.file;

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileKey,
        };

        const fileStream = s3.getObject(params).createReadStream();
        res.attachment(fileKey);
        fileStream.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading file.');
    }
});

module.exports = router;
