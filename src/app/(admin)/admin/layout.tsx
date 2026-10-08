import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const metadata = {
  title: "CompareIt.pk Admin Portal",
  description: "Smartphone Intelligence & Management System",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If unauthenticated or on login page, render children directly without dashboard chrome
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="bg-[#fafafa] text-zinc-900 min-h-screen antialiased selection:bg-orange-500 selection:text-white">
      {/* Fixed Sidebar (256px / w-64) */}
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />

      {/* Main Content Area */}
      <div className="pl-64 flex flex-col min-h-screen">
        <AdminNavbar
          user={{
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
          }}
        />

        <main className="flex-1 pt-16 bg-[#fafafa]">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
