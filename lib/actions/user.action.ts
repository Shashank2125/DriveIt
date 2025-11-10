//Create Account Flow
//User enters full name and email
//Check if the user already exist using the email(we will use to identify the we have to create new user document or not )
//Send OTP to user's email
//This will send a secret key for creating a session.
//Create user doc if new user
//Return the user's accountID that will be used to complete the logic
//Verify OTP and authenticate to login
"use server";
import { parseStringify } from "../utils";
import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { string } from "zod";
import { cookies } from "next/headers";
import { Session } from "inspector/promises";
import { avatarPlaceholderUrl } from "@/constants";
import { error } from "console";
import { redirect } from "next/navigation";

//we will get the user using email as a key
const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    [Query.equal("email", [email])]
  );
  return result.total > 0 ? result.documents[0] : null;
};
//handle error when OTP not swnt
const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();
  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send OTP Please try again");
  }
};
export const createAccount = async ({ fullName, email }: { fullName: string; email: string }) => {
  const existingUser = await getUserByEmail(email);
  //try sending Otp to email
  const accountId = await sendEmailOTP({ email });
  //if accountId doesnot exist
  if (!accountId) throw new Error("Failed to send OTP");
  //if user doesnot exist create a new user and return the account id for the user
  if (!existingUser) {
    const { databases } = await createAdminClient();
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar: avatarPlaceholderUrl,
        accountId,
      }
    );
  }
  //using parse function we created in Utils
  return parseStringify({ accountId });
};
export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();
    //create a session
    const session = await account.createSession(accountId, password);

    //set that session to the cookies
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    //were we return sessionId for the session created
    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Failed to verify OTP.");
  }
};
export const getCurrentUser = async () => {
  try {
    const { databases, account } = await createSessionClient();
    const result = await account.get();
    const user = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", result.$id)]
    );
    if (user.total <= 0) return null;
    return parseStringify(user.documents[0]);
  } catch (error: any) {
    console.warn("⚠️ No active session found, returning null:", error.message);
    return null;
  }
};
export const signOutUser = async () => {
  const { account } = await createSessionClient();
  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    handleError(error, "Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
};
export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);
    //Get user by email if user exists, send OTP
    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }

    return parseStringify({ accountId: null, error: "User not found" });
  } catch (error) {
    handleError(error, "Failed to sign in user");
  }
};
