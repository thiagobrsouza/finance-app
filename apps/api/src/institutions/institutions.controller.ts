import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { InstitutionsService } from "./institutions.service";

type SafeUser = Omit<User, "passwordHash">;

@ApiTags("institutions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("institutions")
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @ApiOperation({ summary: "Lista instituições financeiras pré-cadastradas + custom do usuário" })
  @Get()
  findAll(@CurrentUser() user: SafeUser) {
    return this.institutionsService.findAll(user.id);
  }
}
