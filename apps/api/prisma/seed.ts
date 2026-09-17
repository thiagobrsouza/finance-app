import { PrismaClient } from "@prisma/client";
import { SEEDED_CATEGORIES, SEEDED_INSTITUTIONS, PAYMENT_METHODS } from "@finance-app/shared";

const prisma = new PrismaClient();

async function main() {
  for (const name of SEEDED_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name, isSeeded: true, parentId: null },
    });
    if (!existing) {
      await prisma.category.create({ data: { name, isSeeded: true } });
    }
  }

  for (const institution of SEEDED_INSTITUTIONS) {
    const existing = await prisma.financialInstitution.findFirst({
      where: { name: institution.name, isSeeded: true },
    });
    if (existing) {
      await prisma.financialInstitution.update({
        where: { id: existing.id },
        data: { domain: institution.domain },
      });
    } else {
      await prisma.financialInstitution.create({
        data: { name: institution.name, domain: institution.domain, isSeeded: true },
      });
    }
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
