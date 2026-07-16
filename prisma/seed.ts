import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [alice, bob, carol] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@paperly.app" },
      update: {},
      create: { email: "alice@paperly.app", name: "Alice Owner", passwordHash },
    }),
    prisma.user.upsert({
      where: { email: "bob@paperly.app" },
      update: {},
      create: { email: "bob@paperly.app", name: "Bob Editor", passwordHash },
    }),
    prisma.user.upsert({
      where: { email: "carol@paperly.app" },
      update: {},
      create: { email: "carol@paperly.app", name: "Carol Viewer", passwordHash },
    }),
  ]);

  // Only seed sample documents once so re-running is safe.
  const existing = await prisma.document.count({ where: { ownerId: alice.id } });
  if (existing === 0) {
    const welcome = await prisma.document.create({
      data: {
        title: "Welcome to Paperly",
        ownerId: alice.id,
        starred: true,
        content: `
<h1>Welcome to Paperly</h1>
<p>Paperly is a lightweight collaborative document editor. This document is <strong>owned by Alice</strong> and shared with the whole demo team.</p>
<h2>What you can do</h2>
<ul>
<li>Create, rename, and edit rich-text documents</li>
<li>Import <strong>.txt</strong>, <strong>.md</strong>, and <strong>.docx</strong> files</li>
<li>Share documents as a <em>viewer</em> or <em>editor</em></li>
<li><strong>Star</strong> and <strong>duplicate</strong> documents</li>
</ul>
<p>Try editing this line, then refresh — your changes persist.</p>`.trim(),
        shares: {
          create: [
            { userId: bob.id, role: "EDITOR" },
            { userId: carol.id, role: "VIEWER" },
          ],
        },
      },
    });

    await prisma.document.create({
      data: {
        title: "Product Roadmap — Q3",
        ownerId: alice.id,
        content: `
<h1>Product Roadmap — Q3</h1>
<p>Owned by Alice, shared with Bob as an <strong>editor</strong>.</p>
<ol>
<li>Ship collaborative editing MVP</li>
<li>Add commenting and suggestions</li>
<li>Document version history</li>
</ol>`.trim(),
        shares: { create: [{ userId: bob.id, role: "EDITOR" }] },
      },
    });

    await prisma.document.create({
      data: {
        title: "Bob's Private Notes",
        ownerId: bob.id,
        content:
          "<h1>Bob's Private Notes</h1><p>This document is owned by Bob and is <u>not</u> shared with anyone.</p>",
      },
    });

    console.log(`Seeded sample documents (welcome doc id: ${welcome.id}).`);
  } else {
    console.log("Sample documents already present — skipping document seed.");
  }

  console.log("Seed complete. Demo accounts (password: password123):");
  console.log("  alice@paperly.app  (owns shared docs)");
  console.log("  bob@paperly.app    (editor on Alice's docs)");
  console.log("  carol@paperly.app  (viewer on the welcome doc)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
