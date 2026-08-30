"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Tell us a bit more (10+ characters)"),
});

type ContactInput = z.infer<typeof contactSchema>;

/**
 * UI-only for Phase 1 — wired to a real email/notification send in Phase 5
 * (see Notification model + services/notifications.ts, added then).
 */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  function onSubmit() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success("Message received", {
          description: "Email delivery goes live in Phase 5 — this wasn't sent anywhere yet.",
        });
        reset();
        resolve();
      }, 500);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} {...register("message")} />
        {errors.message && <p className="text-destructive text-xs">{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Send message
      </Button>
    </form>
  );
}
