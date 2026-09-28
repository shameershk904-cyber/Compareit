import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchAdminPhonesAction, fetchBrandsAction } from "./actions";
import { PhonesClient, type PhoneListItem } from "@/components/admin/PhonesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Smartphone Catalog Management - Admin Portal | CompareIt.pk",
};

export default async function AdminPhonesPage() {
  const { authenticated } = await verifyServerSession(["ADMIN", "EDITOR", "VIEWER"]);

  if (!authenticated) {
    redirect("/admin/login?error=AccessDenied");
  }

  const [phonesRes, brandsRes] = await Promise.all([
    fetchAdminPhonesAction({ page: 1, pageSize: 25 }),
    fetchBrandsAction(),
  ]);

  const initialPhones = (phonesRes.success && phonesRes.data?.phones ? phonesRes.data.phones : []) as PhoneListItem[];
  const initialTotal = phonesRes.success && phonesRes.data?.total ? phonesRes.data.total : 0;
  const initialBrands = brandsRes.success && brandsRes.brands ? brandsRes.brands : [];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <PhonesClient
        initialPhones={initialPhones}
        initialTotal={initialTotal}
        initialBrands={initialBrands}
      />
    </div>
  );
}
