import { redirect } from "next/navigation";

/** Root redirect → SMART launch entry */
export default function Home() {
  redirect("/launch");
}
