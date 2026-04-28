import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { seedProducts } from "@/lib/seed";

export async function GET() {
  try {
    await dbConnect();
    await seedProducts();
    const products = await Product.find({ active: true }).lean();
    const grouped = {};
    products.forEach((p) => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });
    return NextResponse.json(grouped);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
