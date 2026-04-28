import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardRoot() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role === "distributor") redirect("/dashboard/distributor");
  if (session.user.role === "delivery_agent") redirect("/dashboard/delivery");
  redirect("/dashboard/retailer");
}
