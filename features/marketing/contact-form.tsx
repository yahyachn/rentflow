"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * UI-only — wired to a real email/notification send once a messaging provider
 * is configured (see Notification model + services/notifications.ts).
 */
export function ContactForm() {
  const t = useTranslations("contact");

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("vRequired")),
        email: z.string().email(t("vEmail")),
        message: z.string().min(10, t("vMessage")),
      }),
    [t],
  );

  type ContactInput = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  function onSubmit() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success(t("okTitle"), { description: t("okDesc") });
        reset();
        resolve();
      }, 500);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">{t("fName")}</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">{t("fEmail")}</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="message">{t("fMessage")}</Label>
        <Textarea id="message" rows={5} {...register("message")} />
        {errors.message && <p className="text-destructive text-xs">{errors.message.message}</p>}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="sheen w-full rounded-xl bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground sm:w-auto"
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        {t("send")}
      </Button>
    </form>
  );
}
