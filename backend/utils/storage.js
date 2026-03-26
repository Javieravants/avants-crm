const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');

const s3 = new S3Client({
  endpoint: `https://${process.env.HETZNER_REGION}.your-objectstorage.com`,
  region: process.env.HETZNER_REGION,
  credentials: {
    accessKeyId: process.env.HETZNER_ACCESS_KEY,
    secretAccessKey: process.env.HETZNER_SECRET_KEY,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.HETZNER_BUCKET;

async function uploadFile(localPath, remoteKey) {
  const fileStream = fs.createReadStream(localPath);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: remoteKey,
      Body: fileStream,
      ContentType: 'application/pdf',
    },
  });
  await upload.done();
  return `${process.env.HETZNER_PUBLIC_URL}/${remoteKey}`;
}

async function uploadBuffer(buffer, remoteKey, contentType = 'application/pdf') {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: remoteKey,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${process.env.HETZNER_PUBLIC_URL}/${remoteKey}`;
}

async function deleteFile(remoteKey) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: remoteKey }));
}

module.exports = { uploadFile, uploadBuffer, deleteFile };
