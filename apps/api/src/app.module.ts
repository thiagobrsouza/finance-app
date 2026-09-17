import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { MailModule } from "./mail/mail.module";
import { AuthModule } from "./auth/auth.module";
import { AccountsModule } from "./accounts/accounts.module";
import { InstitutionsModule } from "./institutions/institutions.module";
import { CreditCardsModule } from "./credit-cards/credit-cards.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { ReportsModule } from "./reports/reports.module";
import { ImportsModule } from "./imports/imports.module";
import { CategoriesModule } from "./categories/categories.module";
import { PaymentMethodsModule } from "./payment-methods/payment-methods.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    AccountsModule,
    InstitutionsModule,
    CreditCardsModule,
    TransactionsModule,
    ReportsModule,
    ImportsModule,
    CategoriesModule,
    PaymentMethodsModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
