import { Module } from "@nestjs/common";
import { CreditCardsModule } from "../credit-cards/credit-cards.module";
import { ReportsController } from "./reports.controller";
import { DashboardController } from "./dashboard.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [CreditCardsModule],
  controllers: [ReportsController, DashboardController],
  providers: [ReportsService],
})
export class ReportsModule {}
