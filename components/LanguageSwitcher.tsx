"use client";

import { useParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const currentLocale = params.locale as string;

  const handleLanguageChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: newLocale }
      );
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-full shadow-lg p-2 flex gap-2">
        <button
          onClick={() => handleLanguageChange("en")}
          disabled={isPending || currentLocale === "en"}
          className={`px-4 py-2 rounded-full font-medium transition ${
            currentLocale === "en"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } disabled:opacity-50`}
        >
          EN
        </button>
        <button
          onClick={() => handleLanguageChange("es")}
          disabled={isPending || currentLocale === "es"}
          className={`px-4 py-2 rounded-full font-medium transition ${
            currentLocale === "es"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } disabled:opacity-50`}
        >
          ES
        </button>
      </div>
    </div>
  );
}
