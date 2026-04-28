import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const { id } = params;
    const { status, assignedAgentId } = await req.json();

    const update = {};
    if (status !== undefined) update.status = status;
    if (assignedAgentId !== undefined) update.assignedAgentId = assignedAgentId || null;

    const order = await Order.findByIdAndUpdate(id, update, { new: true });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
