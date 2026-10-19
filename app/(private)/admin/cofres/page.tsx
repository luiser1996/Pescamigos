import { redirect } from "next/navigation";
import { AdminChestSimulator } from "@/components/admin-chest-simulator";
import { requireUser } from "@/lib/auth";

export default async function AdminChestSimulatorPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return <AdminChestSimulator />;
}
