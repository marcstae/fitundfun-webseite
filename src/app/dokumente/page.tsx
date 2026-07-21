import { redirect } from "next/navigation";
import { getAktuellesLager } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DokumenteRedirect() {
  const lager = await getAktuellesLager();
  if (lager) {
    redirect(`/lager/${lager.jahr}#dokumente`);
  }
  redirect("/lager");
}
