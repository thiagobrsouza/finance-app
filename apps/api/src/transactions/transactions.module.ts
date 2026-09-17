import { Module } from "@nestjs/common";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { RecurringTransactionsJob } from "./recurring-transactions.job";

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, RecurringTransactionsJob],
  exports: [TransactionsService],
})
export class TransactionsModule {}
