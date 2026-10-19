import { redirect } from "next/navigation";
import { AdminForgeSimulator } from "@/components/admin-forge-simulator";
import { requireUser } from "@/lib/auth";

export default async function AdminForgeSimulatorPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return <AdminForgeSimulator />;
}
