import { createFileRoute, notFound, Outlet, redirect } from "@tanstack/react-router";

import { DEFAULT_LANG, isLang } from "@/lib/i18n/languages";
import { splitLangPath } from "@/lib/i18n/paths";

// Every page lives under an optional language prefix: "/tools" is English, "/ps/tools" is Pashto.
export const Route = createFileRoute("/{-$lang}")({
  beforeLoad: ({ params, location }) => {
    if (params.lang === undefined) return;
    if (!isLang(params.lang)) throw notFound();
    // English has no prefix; send "/en/..." to the single English URL.
    if (params.lang === DEFAULT_LANG) {
      throw redirect({ href: splitLangPath(location.pathname).path, statusCode: 301 });
    }
  },
  component: Outlet,
});
