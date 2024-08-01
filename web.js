const express = require('express');
const multer = require('multer');
const ftp = require('ftp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 8009;

// Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// FTP 서버 설정
const ftpServer = 'yogibo.ftp.cafe24.com';
const ftpUsername = 'yogibo';
const ftpPassword = 'korea2024@@';

app.post('/upload', upload.single('file'), (req, res) => {
    const localFilePath = req.file.path;
    const remoteFilePath = `/ftp_uploads/${req.file.filename}`;

    const client = new ftp();

    client.on('ready', () => {
        fs.readFile(localFilePath, (err, data) => {
            if (err) {
                res.status(500).json({ error: 'Failed to read file' });
                return;
            }

            client.put(data, remoteFilePath, (err) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to upload to FTP' });
                    return;
                }

                console.log(`File uploaded to ${remoteFilePath}`);
                client.end();
                fs.unlinkSync(localFilePath); // 로컬 파일 삭제
                res.status(200).json({ message: 'File uploaded successfully' });
            });
        });
    });

    client.connect({
        host: ftpServer,
        user: ftpUsername,
        password: ftpPassword
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
