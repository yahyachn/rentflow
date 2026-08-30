"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { registerAgency } from "@/actions/auth";
import { registerSchema, type RegisterInput } from "@/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  function onSubmit(values: RegisterInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await registerAgency(values);
      if (!result.ok) {
        setServerError(result.error);
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as keyof RegisterInput, { message });
        }
        return;
      }
      toast.success("Welcome to RentFlow!");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center sm:text-left">
        <h1 className="font-display text-2xl font-semibold">Create your agency</h1>
        <p className="text-muted-foreground text-sm">
          Start your 14-day free trial — no credit card required.
        </p>
      </div>

      {serverError && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {serverError}
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="agencyName">Agency name</Label>
        <Input
          id="agencyName"
          placeholder="Atlas Car Rental"
          autoComplete="organization"
          {...register("agencyName")}
        />
        {errors.agencyName && (
          <p className="text-destructive text-xs">{errors.agencyName.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" placeholder="Yasmine Laaroussi" autoComplete="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Work email</Label>
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-destructive text-xs">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending && <Loader2 className="animate-spin" />}
        Create agency account
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
