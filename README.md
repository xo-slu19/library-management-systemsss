# Library Catalog: Data Layer

Prisma + PostgreSQL (hosted on Neon) data layer for a library's book catalog.

## Setup

```bash
npm install
cp .env.example .env                  # add your Postgres connection string
npx prisma migrate dev --name init    # creates the tables
npm run db:seed                       # inserts 16 books, 5 genres, 3 users, 3 reviews
npm run db:studio                     # optional: browse the data
```

The seed uses `upsert`, so it can be re-run without creating duplicates.

## Schema decisions

**Models:** `Book`, `Genre`, `User` (with a `Role` enum), plus `Review` (stretch).

**Genre is its own table, not a string on Book.** Genre names live in one place, so there's no "Sci-Fi" vs "Science Fiction" drift, and renaming a genre is one update. `Book.genreId` is a required foreign key with `onDelete: Restrict`, so a genre can't be deleted while books still use it.

**One genre per book (one-to-many).** This keeps browsing simple. If books later need several genres, it can become an implicit many-to-many.

**`Role` enum (`MEMBER`, `LIBRARIAN`, `ADMIN`)** with a default of `MEMBER`. The database only accepts valid roles, and Prisma generates a matching TypeScript type. The default is the least-privileged role.

**Unique keys:** `Book.isbn` and `User.email` are `@unique`. ISBN is a string because it can start with zero or end with X. Unique ISBNs also make the seed safe to re-run.

**Inventory:** `copiesTotal` and `copiesAvailable` live on `Book`, so availability is a cheap read. Loans are out of scope but would be a separate `Loan` model.

**Indexes:** Postgres doesn't index foreign keys automatically, so I added indexes on `Book.genreId`, `Book.author` and `Review.userId`.

**Review (stretch):** links `Book` and `User`. `@@unique([bookId, userId])` allows one review per user per book. `onDelete: Cascade` removes reviews when their book or user is deleted. The 1-5 rating range is validated in application code.

## Prisma vs. a document database

Modeling in Prisma made me decide on relationships up front. In a document database I might have embedded reviews or the genre name inside each book document and moved on. In Prisma/Postgres these became separate tables with foreign keys, and the database enforces integrity itself (no review for a nonexistent book, no deleting a genre that's in use). The schema file is the single source of truth, and changing it means a migration, so the data's shape can't drift document by document.
