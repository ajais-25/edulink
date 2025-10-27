import { client } from "@/lib/imagekit";

export async function deleteFile(fileId: string) {
  try {
    const result = await client.files.delete(fileId);
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}
