# Panel Beating Management System

## Project Overview

This project is a full-stack web application for managing the daily operations of a panel beating business.

The system supports:

- customer management
- vehicle records
- repair job tracking
- parts inventory
- invoices and payments
- employee management
- demo role-based access

## Project Team

**Group 14**

- TP Sekwadi
- Mugeri R
- Ravhutulu M

**Module:** Advanced Database Systems (Honours)  
**Institution:** University of Limpopo  
**Year:** 2026

## Technology Stack

- Next.js 16
- React 19
- PostgreSQL
- Prisma ORM
- Tailwind CSS 4
- Framer Motion

## Features Implemented

- dashboard with operational counts
- customer creation and deletion
- vehicle creation and deletion
- job creation with customer-to-vehicle validation
- employee management
- parts inventory with stock quantity
- invoice generation
- payment recording
- demo role switching for `ADMIN`, `RECEPTION`, and `TECHNICIAN`

## Role Access Summary

- `ADMIN`: full access
- `RECEPTION`: customer, vehicle, job, inventory, billing access
- `TECHNICIAN`: read-oriented access for jobs and parts

The current build uses a cookie-based demo role selector in the navigation bar to simulate role-based access for academic demonstration purposes.

## API Documentation

- [API specification](docs/API_SPEC.md)
- [Backup plan](docs/BACKUP_PLAN.md)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Ensure PostgreSQL is running and update `.env` with a valid `DATABASE_URL`.

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Apply the schema to the database:

```bash
npm run db:push
```

5. Start the development server:

```bash
npm run dev
```

## Useful Scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run start` - run the production build
- `npm run lint` - run ESLint
- `npm run prisma:generate` - regenerate Prisma client
- `npm run db:push` - push schema changes to the database

## Project Structure

- `app/` - Next.js app router pages, API routes, and components
- `lib/` - database, auth, permission, and API helpers
- `prisma/` - Prisma schema
- `docs/` - API and backup documentation
- `instructions/` - supplied milestone and academic guidance documents

## Documentation Alignment

The remaining milestone items covered in this repository are:

- completed software project
- API specification
- backup and recovery plan
