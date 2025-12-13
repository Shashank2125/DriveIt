//node appwrite sdk
"use server";
import { Account, Avatars, Client, Databases, Storage } from "node-appwrite";
import { appwriteConfig } from "./config";
import { cookies } from "next/headers";
import { error } from "console";
//sesson client created for acessing thier data and the action they need to perform
//were we creating the new client for every request
export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);
  const session = (await cookies()).get("appwrite-session");
  if (!session || !session.value) throw new Error("No session");
  //we create a new session client so that we can keep data safe for the client so it is not exposed to other user
  client.setSession(session.value);
  return {
    //new account
    get account() {
      return new Account(client);
    },
    //or new databses
    get databases() {
      return new Databases(client);
    },
  };
};

export const createAdminClient = async () => {
  const apiKey = process.env.NEXT_APPWRITE_API_KEY;
  if (!apiKey) {
    throw new Error("APPWRITE-API-KEY is missing");
  }
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(apiKey);

  return {
    //new account
    get account() {
      return new Account(client);
    },
    //or new databses
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get avatars() {
      return new Avatars(client);
    },
  };
};
