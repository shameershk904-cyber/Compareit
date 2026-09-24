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
    <div className="bg-surface font-body-md text-on-surface min-h-screen">
      {/* Fixed Sidebar */}
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />

      {/* Main Content Area */}
      <div className="pl-72">
        <AdminNavbar
          user={{
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
          }}
        />

        <main className="relative pt-16 bg-surface min-h-screen">
          <div className="flex flex-col w-full px-space-lg py-space-md space-y-space-lg font-['Poppins',sans-serif] bg-surface">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
