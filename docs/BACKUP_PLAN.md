# Backup and Recovery Plan

This backup plan supports the final milestone requirement and protects the project against source-code and database loss.

## Objectives

- preserve application source code and documentation
- preserve PostgreSQL application data
- reduce recovery time after accidental deletion, corruption, or device failure
- support academic submission, demo preparation, and ongoing development

## Assets to Protect

- application source code in the Git repository
- project documentation in `instructions/` and `docs/`
- Prisma schema in `prisma/schema.prisma`
- environment configuration such as `.env`
- PostgreSQL data used by the application

## Backup Strategy

### 1. Source Code Backup

- Primary version control: Git with remote backup on GitHub
- Working rule: push all meaningful milestones to GitHub after validation
- Recommended branch model:
  - `main` for stable submission-ready work
  - feature branches for large changes

### 2. Documentation Backup

- Keep all final documents inside the repository where possible
- Store exported submission copies in cloud storage such as OneDrive or Google Drive
- Use clear version names, for example `SRS_v1_2026-04-18.docx`

### 3. Database Backup

- Use PostgreSQL dump backups for the application database
- Recommended daily local backup during active development
- Recommended weekly cloud copy of the latest verified dump

Example backup command:

```bash
pg_dump "%DATABASE_URL%" > backups/panel-beating-YYYY-MM-DD.sql
```

### 4. Environment Backup

- Keep `.env` out of public GitHub commits
- Store a secure private copy in encrypted cloud storage or a password manager note
- Maintain a redacted `.env.example` if the project is prepared for public sharing later

## Backup Frequency

- Code: after each completed feature or milestone
- Documentation: whenever a formal document changes
- Database: daily during active development and before demos/submission
- Final submission snapshot: one full backup after final testing and before GitHub push

## Recovery Procedure

### Source Code Recovery

1. Clone the latest GitHub repository
2. Run `npm install`
3. Restore the `.env` file
4. Run `npm run prisma:generate`
5. Run `npm run db:push` or restore a database dump
6. Start the project with `npm run dev`

### Database Recovery

1. Create or access the PostgreSQL database
2. Restore from the latest dump

```bash
psql "%DATABASE_URL%" < backups/panel-beating-YYYY-MM-DD.sql
```

3. Verify core records such as customers, vehicles, jobs, invoices, and users

## Roles and Responsibilities

- Team members: commit and push code regularly, avoid storing secrets in Git
- Project lead: verify that the final GitHub repository and documentation are complete
- Database owner: confirm that the latest SQL dump can be restored successfully

## Verification Checklist

- latest code pushed to GitHub
- latest database dump created
- latest documents stored in cloud backup
- `.env` stored privately
- recovery steps tested at least once before final submission

## Risks and Mitigations

- Accidental deletion: recover from Git or cloud storage history
- Local machine failure: recover from GitHub and cloud document backups
- Database corruption: restore latest SQL dump
- Secret exposure: rotate credentials and replace `.env` values immediately
