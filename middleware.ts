import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const { pathname } = req.nextUrl;

    // Public student profiles: /student/[wallet] (length 3, second part is [wallet])
    const pathParts = pathname.split("/").filter(Boolean);
    const isPublicStudentProfile = pathParts[0] === "student" && pathParts.length === 2;

    if (isPublicStudentProfile) {
      return NextResponse.next();
    }

    // Role-based redirection
    if (isAuth) {
      if (pathname.startsWith("/institution") && token.role !== "institution") {
        return NextResponse.redirect(new URL("/student/portal", req.url));
      }

      if (pathname.startsWith("/student") && token.role !== "student") {
        // Only protected student paths like portal/profile
        if (pathname.startsWith("/student/portal") || pathname.startsWith("/student/profile")) {
          return NextResponse.redirect(new URL("/institution/dashboard", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const pathParts = pathname.split("/").filter(Boolean);
        const isPublicStudentProfile = pathParts[0] === "student" && pathParts.length === 2;
        
        // Always authorized if public profile
        if (isPublicStudentProfile) return true;
        
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/institution/:path*", 
    "/student/portal", 
    "/student/profile"
  ],
};
