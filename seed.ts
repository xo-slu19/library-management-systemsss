import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const catalog: Record<string, [string, string][]> = {
  Fantasy: [
    ["The Hobbit", "J.R.R. Tolkien"],
    ["The Fellowship of the Ring", "J.R.R. Tolkien"],
    ["The Name of the Wind", "Patrick Rothfuss"],
    ["A Game of Thrones", "George R.R. Martin"],
  ],
  "Science Fiction": [
    ["Dune", "Frank Herbert"],
    ["Neuromancer", "William Gibson"],
    ["The Left Hand of Darkness", "Ursula K. Le Guin"],
    ["Project Hail Mary", "Andy Weir"],
  ],
  Mystery: [
    ["The Big Sleep", "Raymond Chandler"],
    ["And Then There Were None", "Agatha Christie"],
    ["Murder on the Orient Express", "Agatha Christie"],
    ["Gone Girl", "Gillian Flynn"],
  ],
  Biography: [
    ["Educated", "Tara Westover"],
    ["Steve Jobs", "Walter Isaacson"],
    ["Long Walk to Freedom", "Nelson Mandela"],
    ["The Diary of a Young Girl", "Anne Frank"],
  ],
};

async function main() {
  let n = 0;

  for (const [genreName, books] of Object.entries(catalog)) {
    const genre = await prisma.genre.upsert({
      where: { name: genreName },
      update: {},
      create: { name: genreName, slug: genreName.toLowerCase().replace(/\s+/g, "-") },
    });

    for (const [title, author] of books) {
      n++;
      const isbn = `978${1000000000 + n}`; // placeholder ISBN, fixed so re-runs don't duplicate
      await prisma.book.upsert({
        where: { isbn },
        update: {},
        create: {
          title,
          author,
          isbn,
          description: `${title} by ${author}.`,
          totalCopies: 3,
          availableCopies: 3,
          genreId: genre.id,
        },
      });
    }
  }

  // Stretch: users + reviews (passwords are placeholders, not real hashes)
  const patron = await prisma.user.upsert({
    where: { email: "patron@library.test" },
    update: {},
    create: { email: "patron@library.test", password: "placeholder", role: Role.PATRON },
  });
  await prisma.user.upsert({
    where: { email: "librarian@library.test" },
    update: {},
    create: { email: "librarian@library.test", password: "placeholder", role: Role.LIBRARIAN },
  });

  for (const [title, rating, comment] of [
    ["Dune", 5, "A sci-fi masterpiece."],
    ["The Hobbit", 5, "Pure comfort reading."],
    ["Gone Girl", 4, "Twisty and gripping."],
  ] as [string, number, string][]) {
    const book = await prisma.book.findFirstOrThrow({ where: { title } });
    await prisma.review.upsert({
      where: { bookId_userId: { bookId: book.id, userId: patron.id } },
      update: {},
      create: { bookId: book.id, userId: patron.id, rating, comment },
    });
  }

  console.log(`Seeded ${Object.keys(catalog).length} genres, ${n} books, 2 users, 3 reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
