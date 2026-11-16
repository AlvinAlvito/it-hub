import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import CredentialForm from "@/components/CredentialForm";

export const dynamic = "force-dynamic";

export default async function Akun() {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <>
      <PageHead kicker="Akun saya" title={user.name}>Ganti password atau PIN brankas. PIN dipakai setiap kali membuka password akun web.</PageHead>
      <div className="wrap max-w-xl"><CredentialForm userId={user.id} self /></div>
    </>
  );
}
