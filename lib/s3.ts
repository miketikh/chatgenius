import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Check required environment variables
if (!process.env.AWS_REGION) throw new Error("AWS_REGION is required")
if (!process.env.AWS_ACCESS_KEY_ID)
  throw new Error("AWS_ACCESS_KEY_ID is required")
if (!process.env.AWS_SECRET_ACCESS_KEY)
  throw new Error("AWS_SECRET_ACCESS_KEY is required")
if (!process.env.AWS_BUCKET_NAME) throw new Error("AWS_BUCKET_NAME is required")

const region = process.env.AWS_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const bucketName = process.env.AWS_BUCKET_NAME

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string
) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: file,
      ContentType: contentType
    })

    await s3Client.send(command)
    return fileName
  } catch (error) {
    console.error("Error uploading to S3:", error)
    throw error
  }
}

export async function getSignedFileUrl(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    })

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // URL expires in 1 hour
  } catch (error) {
    console.error("Error getting signed URL:", error, {
      region,
      bucket: bucketName,
      key
    })
    throw error
  }
}
