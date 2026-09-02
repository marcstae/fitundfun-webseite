import { LagerEditor } from "@/components/admin/lager-editor";

export default async function AdminLagerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LagerEditor id={id} />;
}
