import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function jsonError(message, status = 400, details) {
  return NextResponse.json(
    details ? { error: message, details } : { error: message },
    { status }
  );
}

export function asOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function requireString(value, fieldName) {
  const normalized = asOptionalString(value);

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

export function asOptionalInt(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a whole number.`);
  }

  return parsed;
}

export function requireNonNegativeInt(value, fieldName) {
  const parsed = asOptionalInt(value, fieldName);

  if (parsed === null) {
    throw new Error(`${fieldName} is required.`);
  }

  if (parsed < 0) {
    throw new Error(`${fieldName} cannot be negative.`);
  }

  return parsed;
}

export function requirePositiveDecimal(value, fieldName) {
  const parsed = Number.parseFloat(String(value));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }

  return parsed.toFixed(2);
}

export function asOptionalDate(value, fieldName) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid date.`);
  }

  return parsed;
}

export function handleApiError(error) {
  console.error(error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonError("A record with the same unique value already exists.", 409);
    }

    if (error.code === "P2025") {
      return jsonError("The requested record was not found.", 404);
    }
  }

  if (error instanceof Error) {
    return jsonError(error.message, 400);
  }

  return jsonError("Unexpected server error.", 500);
}
