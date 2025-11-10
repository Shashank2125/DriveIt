export const appwriteConfig = {
  endpointUrl: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
  userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTIONS!,
  filesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTIONS!,
  bucketId: process.env.NEXT_PUBLIC_APPWIRITE_BUCKET!,
  secretKey: process.env.NEXT_APPWRITE_KEY!,
};
