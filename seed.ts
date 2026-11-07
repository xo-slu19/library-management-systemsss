import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const genres = [
  { name: "Science Fiction", slug: "science-fiction" },
  { name: "Fantasy", slug: "fantasy" },
  { name: "Mystery", slug: "mystery" },
  { name: "Non-Fiction", slug: "non-fiction" },
  { name: "Technology", slug: "technology" },
];

const books = [
  { title: "Dune", author: "Frank Herbert", isbn: "9780441013593", publishedYear: 1965, genre: "science-fiction", copies: 3 },
  { title: "Neuromancer", author: "William Gibson", isbn: "9780441569595", publishedYear: 1984, genre: "science-fiction", copies: 2 },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", isbn: "9780441478125", publishedYear: 1969, genre: "science-fiction", copies: 2 },
  { title: "Project Hail Mary", author: "Andy Weir", isbn: "9780593135204", publishedYear: 2021, genre: "science-fiction", copies: 4 },

  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", publishedYear: 1937, genre: "fantasy", copies: 3 },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", isbn: "9780756404741", publishedYear: 2007, genre: "fantasy", copies: 2 },
  { title: "A Game of Thrones", author: "George R.R. Martin", isbn: "9780553593717", publishedYear: 1996, genre: "fantasy", copies: 3 },

  { title: "And Then There Were None", author: "Agatha Christie", isbn: "9780062073488", publishedYear: 1939, genre: "mystery", copies: 2 },
  { title: "Murder on the Orient Express", author: "Agatha Christie", isbn: "9780062693662", publishedYear: 1934, genre: "mystery", copies: 2 },
  { title: "Gone Girl", author: "Gillian Flynn", isbn: "9780307588371", publishedYear: 2012, genre: "mystery", copies: 3 },

  { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316110", publishedYear: 2011, genre: "non-fiction", copies: 3 },
  { title: "Educated", author: "Tara Westover", isbn: "9780399590504", publishedYear: 2018, genre: "non-fiction", copies: 2 },
  { title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", publishedYear: 2018, genre: "non-fiction", copies: 4 },

  { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", publishedYear: 2008, genre: "technology", copies: 2 },
  { title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", isbn: "9780135957059", publishedYear: 2019, genre: "technology", copies: 2 },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", isbn: "9781449373320", publishedYear: 2017, genre: "technology", copies: 2 },
];

const users = [
  { email: "admin@library.test", name: "Ada Admin", role: Role.ADMIN },
  { email: "lib@library.test", name: "Leo Librarian", role: Role.LIBRARIAN },
  { email: "member@library.test", name: "Mia Member", role: Role.MEMBER },
];

async function main() {
  const genreIds: Record<string, number> = {};
  for (const g of genres) {
    const row = await prisma.genre.upsert({ where: { slug: g.slug }, update: {}, create: g });
    genreIds[g.slug] = row.id;
  }

  for (const { genre, copies, ...b } of books) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: { ...b, copiesTotal: copies, copiesAvailable: copies, genreId: genreIds[genre] },
    });
  }

  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
  }

  const member = await prisma.user.findUniqueOrThrow({ where: { email: "member@library.test" } });
  const sample = [
    { isbn: "9780441013593", rating: 5, comment: "A sci-fi masterpiece." },
    { isbn: "9780132350884", rating: 4, comment: "Opinionated but useful." },
    { isbn: "9780062073488", rating: 5, comment: "Couldn't put it down." },
  ];
  for (const r of sample) {
    const book = await prisma.book.findUniqueOrThrow({ where: { isbn: r.isbn } });
    await prisma.review.upsert({
      where: { bookId_userId: { bookId: book.id, userId: member.id } },
      update: {},
      create: { bookId: book.id, userId: member.id, rating: r.rating, comment: r.comment },
    });
  }

  console.log(`Seeded ${genres.length} genres, ${books.length} books, ${users.length} users, ${sample.length} reviews`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());