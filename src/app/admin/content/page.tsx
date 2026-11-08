import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminContent from "@/components/admin-content";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nội dung truyện",
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  let authed = false;

  try {
    authed = await isAdmin();
  } catch {
    authed = false;
  }

  if (!authed) redirect("/admin");

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">
            Khu vực quản trị
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink">Nội dung truyện</h1>
        </div>
        <Link href="/admin" className="btn-secondary">
          ← Lượt chơi
        </Link>
      </div>

      <AdminContent />
    </main>
  );
}
