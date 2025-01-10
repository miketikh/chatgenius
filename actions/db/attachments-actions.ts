"use server"

import { db } from "@/db/db"
import { SelectAttachment, attachmentsTable } from "@/db/schema"
import { getSignedFileUrl, uploadToS3 } from "@/lib/s3"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function uploadAttachmentAction(
  formData: FormData,
  userId: string,
  messageId?: string,
  directMessageId?: string
): Promise<ActionState<SelectAttachment>> {
  try {
    const file = formData.get("file") as File
    if (!file) {
      throw new Error("No file provided")
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const url = await uploadToS3(buffer, file.name, file.type)

    const [attachment] = await db
      .insert(attachmentsTable)
      .values({
        userId,
        messageId,
        directMessageId,
        name: file.name,
        url,
        size: file.size.toString(),
        type: file.type
      })
      .returning()

    return {
      isSuccess: true,
      message: "File uploaded successfully",
      data: attachment
    }
  } catch (error) {
    console.error("Error uploading attachment:", error)
    return { isSuccess: false, message: "Failed to upload file" }
  }
}

export async function getAttachmentsAction(
  messageId?: string,
  directMessageId?: string
): Promise<ActionState<SelectAttachment[]>> {
  try {
    let attachments: SelectAttachment[] = []

    if (messageId) {
      attachments = await db
        .select()
        .from(attachmentsTable)
        .where(eq(attachmentsTable.messageId, messageId))
    } else if (directMessageId) {
      attachments = await db
        .select()
        .from(attachmentsTable)
        .where(eq(attachmentsTable.directMessageId, directMessageId))
    }

    return {
      isSuccess: true,
      message: "Attachments retrieved successfully",
      data: attachments
    }
  } catch (error) {
    console.error("Error getting attachments:", error)
    return { isSuccess: false, message: "Failed to get attachments" }
  }
}

export async function deleteAttachmentAction(
  id: string
): Promise<ActionState<void>> {
  try {
    await db.delete(attachmentsTable).where(eq(attachmentsTable.id, id))

    return {
      isSuccess: true,
      message: "Attachment deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return { isSuccess: false, message: "Failed to delete attachment" }
  }
}

export async function getSignedUrlAction(
  key: string
): Promise<ActionState<string>> {
  try {
    const url = await getSignedFileUrl(key)
    return {
      isSuccess: true,
      message: "Signed URL generated successfully",
      data: url
    }
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return { isSuccess: false, message: "Failed to generate signed URL" }
  }
} 