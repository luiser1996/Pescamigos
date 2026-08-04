import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function Settings() {
  const user = await requireUser();
  redirect(`/pescadores/${user.id}?edit=1`);
}
