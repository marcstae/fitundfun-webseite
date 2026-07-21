import { redirect } from "next/navigation";
import { getAktuellesLager } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FotosRedirect() {
  const lager = await getAktuellesLager();
  if (lager?.immich_url) {
    redirect(lager.immich_url);
  }
  redirect("/lager");
}
