import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string
) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileName,
      Body: file,
      ContentType: contentType
    })

    await s3Client.send(command)
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
  } catch (error) {
    console.error("Error uploading to S3:", error)
    throw error
  }
}

export async function getSignedFileUrl(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key
    })

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // URL expires in 1 hour
  } catch (error) {
    console.error("Error getting signed URL:", error)
    throw error
  }
}
