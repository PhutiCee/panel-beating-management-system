import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth?.token?.role;

    if (pathname === '/login' || pathname === '/register') return NextResponse.next();

    if (pathname.startsWith('/users') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (role === 'TECHNICIAN' && (pathname.startsWith('/customers') || pathname.startsWith('/vehicles') || pathname.startsWith('/invoices'))) {
      return NextResponse.redirect(new URL('/jobs', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/api/register')) return true;
        return !!token;
      },
    },
    pages: { signIn: '/login' },
  }
);

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)'],
};
