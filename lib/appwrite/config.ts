export const appwriteConfig = {
  // ✅ Public (safe)
  endpointUrl: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,

  // ✅ Server-only (DO NOT prefix with NEXT_PUBLIC)
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
  userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTIONS!,
  filesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTIONS!,
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
};
