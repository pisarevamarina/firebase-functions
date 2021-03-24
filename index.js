const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const BusBoy = require('busboy');
const os = require('os');
const path = require('path');

const fs =require('fs');

const gcsConfig = {
  projectId: 'file-uploader-f525b',
  keyFileName: 'file-uploader-f525b-firebase-adminsdk-gmivx-104da62bb9.json',
};

// const gcs = require('@google-cloud/storage')(gcconfig);
const {Storage} = require('@google-cloud/storage');

const gcs = new Storage(gcsConfig);

exports.uploadFile = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== 'POST') {
      return res.status(500).json({
        message: 'Not allowed',
      });
    }
    const busBoy = new BusBoy({headers: req.headers});
    let uploadData = null;

    busBoy.on('file', (fieldName, file, fileName, encoding, mimeType) => {
      const filePath = path.join(os.tmpdir(), fileName);
      uploadData = {file: filePath, type: mimeType};
      file.pipe(fs.createWriteStream(filePath));
    });

    busBoy.on('finish', () => {
      const bucket = gcs.bucket('file-uploader-f525b.appspot.com/');
      bucket.upload(uploadData.file, {
        uploadType: 'media',
        metadata: {
          metadata: {
            contentType: uploadData.type,
          },
        },
      }).then(() => {
        res.status(200).json({
          message: 'File has been uploaded',
        });
      }).catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
    });
    busBoy.end(req.rawBody);
  });
});
