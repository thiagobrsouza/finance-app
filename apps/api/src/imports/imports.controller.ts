import { Body, Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ImportsService } from "./imports.service";
import { ConfirmImportDto } from "./dto/confirm-import.dto";

type SafeUser = Omit<User, "passwordHash">;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags("imports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("imports")
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @ApiOperation({ summary: "Faz upload de um extrato (.csv, .xlsx ou .ofx) e retorna um preview, sem persistir nada" })
  @ApiConsumes("multipart/form-data")
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  upload(@CurrentUser() user: SafeUser, @UploadedFile() file: Express.Multer.File) {
    return this.importsService.upload(user.id, file);
  }

  @ApiOperation({ summary: "Confirma a importação das transações selecionadas do preview" })
  @Post(":previewId/confirm")
  confirm(@CurrentUser() user: SafeUser, @Param("previewId") previewId: string, @Body() dto: ConfirmImportDto) {
    return this.importsService.confirm(user.id, previewId, dto);
  }
}
