"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import Image from "next/image";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "./ui/button";

import React, { useState } from "react";
import { createAccount, signInUser } from "@/lib/actions/user.action";
import OTPModal from "./OTPModal";
type FormType = "sign-in" | "sign-up";
const authFormSchema = (formType: FormType) => {
  return z.object({
    email: z.string().email(),
    fullName: formType === "sign-up" ? z.string().min(2).max(50) : z.string().optional(),
  });
};

//type is implemented so that we can re use in both pages
const AuthForm = ({ type }: { type: FormType }) => {
  const initialState = false;
  const [isLoading, setIsLoading] = useState(initialState);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [accountId, setAccountId] = useState(null);
  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const user =
        type === "sign-up"
          ? await createAccount({
              fullName: values.fullName || "",
              email: values.email,
            })
          : await signInUser({ email: values.email });
      setAccountId(user.accountId);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account. Please try again.");
    }
    {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title">{type === "sign-in" ? "Sign-In" : "Sign Up"}</h1>
          {type === "sign-up" && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <div className=" shad-form-item">
                    <FormLabel className="shad-form-label">Full Name</FormLabel>

                    <FormControl>
                      <Input placeholder="Enter your Full Name" className="shad-input" {...field} />
                    </FormControl>
                  </div>

                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className=" shad-form-item">
                  <FormLabel className="shad-form-label">Email</FormLabel>

                  <FormControl>
                    <Input placeholder="Enter your Email" className="shad-input" {...field} />
                  </FormControl>
                </div>

                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />
          {/*submit button*/}
          <Button type="submit" className="form-submit-button">
            {type === "sign-up" ? "Sign Up" : "Sign In"}
            {isLoading && (
              <Image
                src="/assets/icons/loader.svg"
                alt="loader"
                width={24}
                height={24}
                className="ml-2 animate-spin"
              />
            )}
          </Button>
        </form>
      </Form>
      {/*OTP Verification*/}
      {accountId && <OTPModal email={form.getValues("email")} accountId={accountId} />}
    </>
  );
};

export default AuthForm;
