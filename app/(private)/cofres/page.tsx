import { ChestOpener } from "@/components/chest-opener";
import { requireUser } from "@/lib/auth";
import { availableChests } from "@/lib/chests";

export default async function ChestsPage() {
  const user = await requireUser();
  return <ChestOpener initialAvailable={await availableChests(user.id)} />;
}
