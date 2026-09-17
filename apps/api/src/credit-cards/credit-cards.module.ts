import { Module } from "@nestjs/common";
import { CreditCardsController } from "./credit-cards.controller";
import { CreditCardsService } from "./credit-cards.service";

@Module({
  controllers: [CreditCardsController],
  providers: [CreditCardsService],
})
export class CreditCardsModule {}
