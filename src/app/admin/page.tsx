import type { Metadata } from "next";

import AdminPanel from "@/components/admin-panel";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  let authed = false;

  try {
    authed = await isAdmin();
  } catch {
    authed = false;
  }

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">
        Khu vực quản trị
      </p>
      <AdminPanel initialAuthed={authed} />
    </main>
  );
}
