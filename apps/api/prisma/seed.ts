import { PrismaClient } from "@prisma/client";
import { SEEDED_CATEGORIES, SEEDED_INSTITUTIONS, PAYMENT_METHODS } from "@finance-app/shared";

const prisma = new PrismaClient();

async function main() {
  for (const name of SEEDED_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: `seed-category-${name}` },
      update: {},
      create: { id: `seed-category-${name}`, name, isSeeded: true },
    });
  }

  for (const institution of SEEDED_INSTITUTIONS) {
    await prisma.financialInstitution.upsert({
      where: { id: `seed-institution-${institution.name}` },
      update: { domain: institution.domain },
      create: {
        id: `seed-institution-${institution.name}`,
        name: institution.name,
        domain: institution.domain,
        isSeeded: true,
      },
    });
  }

  for (const method of PAYMENT_METHODS) {
    await prisma.paymentMethod.upsert({
      where: { slug: method.slug },
      update: { name: method.name, requiresCreditCard: method.requiresCreditCard },
      create: {
        name: method.name,
        slug: method.slug,
        requiresCreditCard: method.requiresCreditCard,
      },
    });
  }

  console.log(
    `Seed concluído: ${SEEDED_CATEGORIES.length} categorias, ${SEEDED_INSTITUTIONS.length} instituições, ${PAYMENT_METHODS.length} formas de pagamento.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
