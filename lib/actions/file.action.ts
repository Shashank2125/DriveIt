"use server";

import { createAdminClient, createSessionClient } from "../appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "../appwrite/config";
import { ID, Models, Query, Users } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { error } from "console";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.action";
import path from "path";

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
const createQueries = (
  currentUser: Models.Document,
  types: string[],
  searchText: string,
  sort: string,
  limit?: number
) => {
  const queries = [
    Query.or([
      Query.equal("owner", [currentUser.$id]),
      Query.contains("users", [currentUser.email]),
    ]),
  ];
  if (types.length > 0) queries.push(Query.equal("type", types));
  //this does it compares query coming from Https://.....?query="name"
  //we compare the name with our file names which we have uploaded
  if (searchText) queries.push(Query.contains("name", searchText));
  //limit the number of photo or files per page
  if (limit) queries.push(Query.limit(limit));
  //sortby the order of creation and orderby descending or ascending
  if (sort) {
    const [sortBy, orderBy] = sort.split("-");
    queries.push(orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy));
  }

  return queries;
};
export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit,
}: GetFilesProps) => {
  const { databases } = await createAdminClient();
  try {
    //get the current user
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found !!!");
    const queries = createQueries(currentUser, types, searchText, sort, limit);
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
//use it to rename our Files in action dropdown
export const renameFile = async ({ fileId, name, extension, path }: RenameFileProps) => {
  const { databases } = await createAdminClient();
  try {
    const newName = `${name}.${extension}`;
    //get the data of the existing doc were it databaseId and collectionId
    const updateFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      //change it's name to newName or given name
      fileId,
      {
        name: newName,
      }
    );
    //revalidate to new path and return File
    revalidatePath(path);

    return parseStringify(updateFile);
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export const UpdateFileUsers = async ({ fileId, emails, path }: UpdateFileUsersProps) => {
  const { databases } = await createAdminClient();
  try {
    //get the data of the existing doc were it databaseId and collectionId
    const updateFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      //change it's name to newName or given name
      fileId,
      {
        //instead of rename we re intialize the emails to users on update
        users: emails,
      }
    );
    //revalidate to new path and return File
    revalidatePath(path);

    return parseStringify(updateFile);
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};
export const deleteFile = async ({ fileId, bucketFileId, path }: DeleteFileProps) => {
  const { databases, storage } = await createAdminClient();
  try {
    //get the data of the existing doc were it databaseId and collectionId
    const deletedFile = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      //change it's name to newName or given name
      fileId
    );
    if (deletedFile) {
      await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
    }
    //revalidate to new path and return File
    revalidatePath(path);

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};
// Total Space Used
export async function getTotalSpaceUsed() {
  try {
    const { databases } = await createSessionClient();
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User is not authenticated.");

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      [Query.equal("owner", [currentUser.$id])]
    );
    const totalSpace = {
      image: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
      used: 0,
      all: 2 * 1024 * 1024, //2gb available bucket storage
    };
    files.documents.forEach((file) => {
      const fileType = file.type as FileType;
      totalSpace[fileType].size += file.size;
      totalSpace.used += file.size;
      if (
        !totalSpace[fileType].latestDate ||
        new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
      ) {
        totalSpace[fileType].latestDate = file.$updatedAt;
      }
    });
    return parseStringify(totalSpace);
  } catch (error) {
    handleError(error, "Error calculating total space used");
  }
}
