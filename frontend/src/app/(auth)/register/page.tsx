import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { Suspense } from "react";
import { Register } from "@/features/auth/Register";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Sign up | Syncro"),
    description: t("Create your Syncro account."),
  };
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#f7f9ff]" aria-hidden="true" />}
    >
      <Register />
    </Suspense>
  );
}
