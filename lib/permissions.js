export const APP_ROLES = ["ADMIN", "RECEPTION", "TECHNICIAN"];

export const PERMISSIONS = {
  manageCustomers: "manageCustomers",
  manageVehicles: "manageVehicles",
  manageJobs: "manageJobs",
  manageParts: "manageParts",
  manageInvoices: "manageInvoices",
  managePayments: "managePayments",
  manageUsers: "manageUsers",
  viewParts: "viewParts",
  viewJobs: "viewJobs",
};

const ROLE_PERMISSIONS = {
  ADMIN: Object.values(PERMISSIONS),
  RECEPTION: [
    PERMISSIONS.manageCustomers,
    PERMISSIONS.manageVehicles,
    PERMISSIONS.manageJobs,
    PERMISSIONS.manageParts,
    PERMISSIONS.manageInvoices,
    PERMISSIONS.managePayments,
    PERMISSIONS.viewParts,
    PERMISSIONS.viewJobs,
  ],
  TECHNICIAN: [PERMISSIONS.viewJobs, PERMISSIONS.viewParts],
};

export function isValidRole(role) {
  return APP_ROLES.includes(role);
}

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRoleLabel(role) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
