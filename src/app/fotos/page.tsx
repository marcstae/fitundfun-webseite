import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getNeustesFotoalbum } from "@/lib/data";
import { FAMILY_ACCESS_COOKIE, hasFamilyAccess } from "@/lib/family-access";
import { isValidHttpUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FotosRedirect() {
  const cookieStore = await cookies();
  const album = await getNeustesFotoalbum(
    cookieStore.toString(),
    await hasFamilyAccess(cookieStore.get(FAMILY_ACCESS_COOKIE)?.value)
  );
  const albumUrl = album.fotoalbum?.url || "";

  if (isValidHttpUrl(albumUrl)) redirect(albumUrl);
  if (album.fotoalbum && album.jahr) redirect(`/lager/${album.jahr}`);
  if (album.hasFotoalbum && album.jahr) {
    redirect(`/lager/${album.jahr}?fotos=1#familienzugang`);
  }
  redirect("/lager");
}
