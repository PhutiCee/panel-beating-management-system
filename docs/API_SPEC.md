# Panel Beating Management System API Specification

This document captures the current REST API surface for the application.

## Base URL

- Development: `http://localhost:3000`
- API prefix: `/api`

## Authentication Model

- The project currently uses a demo role cookie, `pbms-role`, to simulate role-based access.
- Supported roles: `ADMIN`, `RECEPTION`, `TECHNICIAN`
- Write endpoints return `403` if the selected role does not have permission.

## Common Response Codes

- `200` successful read/update/delete
- `201` record created
- `400` validation error
- `403` insufficient permissions
- `404` record not found
- `409` unique constraint conflict
- `500` unexpected server error

## Session

### `GET /api/session/role`

- Returns the active demo role.

### `POST /api/session/role`

- Sets the active demo role cookie.

Request body:

```json
{
  "role": "ADMIN"
}
```

## Customers

### `GET /api/customers`

- Returns all customers with linked vehicles and jobs.

### `POST /api/customers`

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "0820000000",
  "address": "Polokwane"
}
```

### `PUT /api/customers/{id}`

- Updates a customer.

### `DELETE /api/customers/{id}`

- Deletes a customer and cascades linked records according to the database rules.

## Vehicles

### `GET /api/vehicles`

- Returns all vehicles with owner details.

### `POST /api/vehicles`

Request body:

```json
{
  "make": "Toyota",
  "model": "Hilux",
  "year": 2020,
  "regNumber": "ABC123L",
  "vin": "VIN0001",
  "customerId": "customer_cuid"
}
```

### `PUT /api/vehicles/{id}`

- Updates a vehicle.

### `DELETE /api/vehicles/{id}`

- Deletes a vehicle.

## Jobs

### `GET /api/jobs`

- Returns jobs with customer, vehicle, technician, parts, estimate, invoice, and payments.

### `POST /api/jobs`

Request body:

```json
{
  "title": "Rear bumper repair",
  "description": "Repair impact damage",
  "status": "NEW",
  "customerId": "customer_cuid",
  "vehicleId": "vehicle_cuid",
  "assignedToId": "user_cuid"
}
```

Rules:

- `vehicleId` must belong to `customerId`

### `PUT /api/jobs/{id}`

- Updates a job.

Rules:

- job status cannot move backwards
- selected vehicle must belong to selected customer

### `DELETE /api/jobs/{id}`

- Deletes a job.

## Users / Employees

### `GET /api/users`

- Returns all users with assigned job counts.

### `POST /api/users`

Request body:

```json
{
  "name": "Technician One",
  "email": "tech1@example.com",
  "phone": "0821234567",
  "role": "TECHNICIAN"
}
```

### `PUT /api/users/{id}`

- Updates an employee record.

### `DELETE /api/users/{id}`

- Deletes an employee record.

## Parts

### `GET /api/parts`

- Returns all inventory items with usage counts.

### `POST /api/parts`

Request body:

```json
{
  "name": "Rear Bumper",
  "quantityInStock": 3,
  "unitPrice": 2500.0
}
```

### `PUT /api/parts/{id}`

- Updates a part.

### `DELETE /api/parts/{id}`

- Deletes a part.

## Invoices

### `GET /api/invoices`

- Returns invoices with job, customer, vehicle, and payments.

### `POST /api/invoices`

Request body:

```json
{
  "jobId": "job_cuid",
  "amount": 5400.0,
  "status": "DRAFT"
}
```

Rules:

- one invoice per job
- creating an invoice moves the job to `INVOICED`

### `PUT /api/invoices/{id}`

- Updates invoice amount or status.

### `DELETE /api/invoices/{id}`

- Deletes an invoice and moves the related job back to `COMPLETED`

## Payments

### `POST /api/payments`

Request body:

```json
{
  "invoiceId": "invoice_cuid",
  "amount": 1000.0,
  "method": "EFT"
}
```

Rules:

- payment amount must be greater than zero
- invoice status automatically changes to `SENT` or `PAID` based on total payments
