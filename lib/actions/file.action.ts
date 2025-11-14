"use server";

import { createAdminClient } from "../appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "../appwrite/config";
import { ID, Models, Query, Users } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { error } from "console";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.action";

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

//UploadFileProps are global Props which are declared globally and can be used without importing

export const uploadFile = async ({ file, ownerId, accountId, path }: UploadFileProps) => {
  const { storage, databases } = await createAdminClient();
  try {
    //appwrite Storage
    //Read and convert it into the inputFile
    const inputFile = InputFile.fromBuffer(file, file.name);
    //Create a BucketFile were we can store our File
    const bucketFile = await storage.createFile(appwriteConfig.bucketId, ID.unique(), inputFile);
    const fileDocument = {
      //appwrite databases

      //meta data about the file for user Interface for more accessibility
      type: getFileType(bucketFile.name).type,
      name: bucketFile.name,
      url: constructFileUrl(bucketFile.$id),
      extension: getFileType(bucketFile.name).extension,
      size: bucketFile.sizeOriginal,
      owner: ownerId,
      accountId,
      users: [],
      bucketFileId: bucketFile.$id,
    };
    const newFile = await databases
      .createDocument(
        //storage of file in database with filecollectionsId and were we
        //give it ID and file document
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        ID.unique(),
        fileDocument
      )
      .catch(async (error: unknown) => {
        await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
        handleError(error, "Failed to create file document");
      });
    revalidatePath(path);
    return parseStringify(newFile);
  } catch (error) {
    handleError(error, "Failed to Upload a file ");
  }
};
const createQueries = (currentUser: Models.Document) => {
  const queries = [
    Query.or([
      Query.equal("owner", [currentUser.$id]),
      Query.contains("users", [currentUser.email]),
    ]),
  ];
  //extend them:Search.sort,limits....
  return queries;
};
export const getFiles = async () => {
  const { databases } = await createAdminClient();
  try {
    //get the current user
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found !!!");
    const queries = createQueries(currentUser);
    console.log({ currentUser, queries });
    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      //query the files all queries
      queries
    );
    console.log({ files });
    return parseStringify(files);
  } catch (error) {
    handleError(error, "Failed to get Files");
  }
};
