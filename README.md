## Schema Decisions
 
Book references Genre via a genreId foreign key rather than embedding the
genre name directly, because many books share one genre and genres are
managed independently (renaming a genre should not require updating every
book). User stores a `role` field using a Role enum so Postgres and
TypeScript both reject any value other than PATRON or LIBRARIAN.
