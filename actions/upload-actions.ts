"use server"

import { ActionState } from "@/types"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UploadResult {
  fileUrl: string
  fileName: string
  fileType: string
}

export async function uploadFileAction(
  file: File,
  userId: string
): Promise<ActionState<UploadResult>> {
  try {
    const fileName = `${userId}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .upload(fileName, file)

    if (error) {
      throw error
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${data.path}`

    return {
      isSuccess: true,
      message: "File uploaded successfully",
      data: {
        fileUrl,
        fileName: file.name,
        fileType: file.type
      }
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { isSuccess: false, message: "Failed to upload file" }
  }
}

export async function deleteFileAction(
  filePath: string
): Promise<ActionState<void>> {
  try {
    const { error } = await supabase.storage
      .from("chat-attachments")
      .remove([filePath])

    if (error) {
      throw error
    }

    return {
      isSuccess: true,
      message: "File deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    return { isSuccess: false, message: "Failed to delete file" }
  }
} 