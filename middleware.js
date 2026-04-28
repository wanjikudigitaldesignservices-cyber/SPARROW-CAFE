import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function getDashboardPath(role) {
  if (role === "delivery_agent") return "/dashboard/delivery";
  return `/dashboard/${role}`;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard/distributor") && token.role !== "distributor") {
      return NextResponse.redirect(new URL(getDashboardPath(token.role), req.url));
    }
    if (path.startsWith("/dashboard/delivery") && token.role !== "delivery_agent") {
      return NextResponse.redirect(new URL(getDashboardPath(token.role), req.url));
    }
    if (path.startsWith("/dashboard/retailer") && token.role !== "retailer") {
      return NextResponse.redirect(new URL(getDashboardPath(token.role), req.url));
    }
  },
  {
    callbacks: {
      authorized({ req, token }) {
        return !!token;
      }
    },
    pages: {
      signIn: "/login"
    }
  }
);

export const config = {
  matcher: ["/dashboard/:path*"]
};
