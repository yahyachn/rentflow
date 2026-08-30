"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(values: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setServerError(error.message ?? "Invalid email or password.");
        return;
      }

      toast.success("Welcome back!");
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center sm:text-left">
        <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your RentFlow dashboard.</p>
      </div>

      {serverError && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {serverError}
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@agency.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-destructive text-xs">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending && <Loader2 className="animate-spin" />}
        Sign in
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an agency yet?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Start your free trial
        </Link>
      </p>
    </form>
  );
}
