import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { APP_ROLES, getRoleLabel, hasPermission, isValidRole } from "./permissions";

export const ROLE_COOKIE_NAME = "pbms-role";
export const DEFAULT_ROLE = "ADMIN";

export function normalizeRole(role) {
  return isValidRole(role) ? role : DEFAULT_ROLE;
}

export function getRequestRole(request) {
  const cookieRole = request.cookies.get(ROLE_COOKIE_NAME)?.value;
  const headerRole = request.headers.get("x-user-role");
  return normalizeRole(cookieRole || headerRole || process.env.NEXT_PUBLIC_DEMO_ROLE);
}

export async function getCurrentRole() {
  const cookieStore = await cookies();
  return normalizeRole(
    cookieStore.get(ROLE_COOKIE_NAME)?.value || process.env.NEXT_PUBLIC_DEMO_ROLE
  );
}

export function setRoleCookie(response, role) {
  response.cookies.set(ROLE_COOKIE_NAME, normalizeRole(role), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export function requirePermission(request, permission) {
  const role = getRequestRole(request);

  if (!hasPermission(role, permission)) {
    return {
      role,
      error: NextResponse.json(
        { error: `${getRoleLabel(role)} does not have permission to perform this action.` },
        { status: 403 }
      ),
    };
  }

  return { role };
}

export function getAssignableRoles() {
  return APP_ROLES;
}
