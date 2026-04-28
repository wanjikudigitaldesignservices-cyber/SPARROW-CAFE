import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import OrderCrate from "@/lib/models/OrderCrate";
import CrateItem from "@/lib/models/CrateItem";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";

const SLOT_RULES = {
  "300ml": 24,
  "500ml": 24,
  "1L": 12,
  "maid": 12,
  "dasani": 24,
  "monster": 24
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "retailer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const { crates } = await req.json();

    for (const crate of crates) {
      const totalQty = crate.items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQty !== SLOT_RULES[crate.crateType]) {
        return NextResponse.json(
          { error: `${crate.crateType} crate is not full (${totalQty}/${SLOT_RULES[crate.crateType]})` },
          { status: 400 }
        );
      }
    }

    const order = await Order.create({
      retailerId: session.user.id,
      status: "pending"
    });

    for (const crate of crates) {
      const orderCrate = await OrderCrate.create({
        orderId: order._id,
        crateType: crate.crateType,
        slotsTotal: SLOT_RULES[crate.crateType]
      });
      for (const item of crate.items) {
        await CrateItem.create({
          crateId: orderCrate._id,
          productId: item.productId,
          quantity: item.quantity
        });
      }
    }

    return NextResponse.json({ success: true, orderId: order._id }, { status: 201 });
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
    if (session.user.role === "retailer") {
      query.retailerId = session.user.id;
    } else if (session.user.role === "delivery_agent") {
      query.assignedAgentId = session.user.id;
      query.status = { $in: ["dispatched", "delivered"] };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const crates = await OrderCrate.find({ orderId: order._id }).lean();
        const cratesWithItems = await Promise.all(
          crates.map(async (crate) => {
            const items = await CrateItem.find({ crateId: crate._id }).lean();
            const itemsWithProduct = await Promise.all(
              items.map(async (item) => {
                const product = await Product.findById(item.productId).lean();
                return { ...item, product };
              })
            );
            return { ...crate, items: itemsWithProduct };
          })
        );
        const retailer = await User.findById(order.retailerId).lean();
        const agent = order.assignedAgentId
          ? await User.findById(order.assignedAgentId).lean()
          : null;
        return { ...order, crates: cratesWithItems, retailer, agent };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
