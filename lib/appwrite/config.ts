export const appwriteConfig = {
  // ✅ Public (safe)
  endpointUrl: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT!,

  // ✅ Server-only (DO NOT prefix with NEXT_PUBLIC)
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!,
  filesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION!,
  bucketId: process.env.APPWRITE_BUCKET_ID!,
};
