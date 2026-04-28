import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BottleReturn from "@/lib/models/BottleReturn";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "delivery_agent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const { orderId, cratesDelivered, bottlesReturned, returnStatus, notes } = await req.json();

    await BottleReturn.create({
      orderId,
      deliveryAgentId: session.user.id,
      cratesDelivered,
      bottlesReturned,
      returnStatus,
      notes
    });

    await Order.findByIdAndUpdate(orderId, { status: "delivered" });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    let query = {};
    if (session.user.role === "delivery_agent") {
      query.deliveryAgentId = session.user.id;
    }

    const returns = await BottleReturn.find(query).sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(
      returns.map(async (ret) => {
        const order = await Order.findById(ret.orderId).lean();
        const retailer = order ? await User.findById(order.retailerId).lean() : null;
        const agent = await User.findById(ret.deliveryAgentId).lean();
        return { ...ret, order, retailer, agent };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
