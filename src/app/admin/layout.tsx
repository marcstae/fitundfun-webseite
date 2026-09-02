import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireEditor } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const editor = await requireEditor();
  return <AdminShell email={editor.email}>{children}</AdminShell>;
}
