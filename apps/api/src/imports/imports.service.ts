import { randomUUID } from "crypto";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import { TransactionsService } from "../transactions/transactions.service";
import { parseCsv } from "./parsers/csv.parser";
import { parseXlsx } from "./parsers/xlsx.parser";
import { parseOfx } from "./parsers/ofx.parser";
import { ParsedRow } from "./parsers/types";
import { ConfirmImportDto } from "./dto/confirm-import.dto";

interface PreviewEntry {
  userId: string;
  fileName: string;
  format: string;
  rows: ParsedRow[];
  createdAt: number;
}

const PREVIEW_TTL_MS = 30 * 60_000;

@Injectable()
export class ImportsService {
  private readonly previews = new Map<string, PreviewEntry>();

  constructor(private readonly transactionsService: TransactionsService) {}

  upload(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo enviado");
    }

    const format = this.detectFormat(file.originalname);
    const { rows, warnings } = this.parse(format, file.buffer);

    this.cleanupExpired();
    const previewId = randomUUID();
    this.previews.set(previewId, { userId, fileName: file.originalname, format, rows, createdAt: Date.now() });

    return {
      previewId,
      fileName: file.originalname,
      format,
      transactions: rows.map((row, index) => ({ index, ...row })),
      warnings,
    };
  }

  async confirm(userId: string, previewId: string, dto: ConfirmImportDto) {
    const preview = this.previews.get(previewId);
    if (!preview || Date.now() - preview.createdAt > PREVIEW_TTL_MS) {
      this.previews.delete(previewId);
      throw new NotFoundException("Preview não encontrado ou expirado — envie o arquivo novamente");
    }
    if (preview.userId !== userId) {
      throw new ForbiddenException();
    }

    const invalidIndex = dto.selectedIndexes.find((i) => i < 0 || i >= preview.rows.length);
    if (invalidIndex !== undefined) {
      throw new BadRequestException(`Índice inválido: ${invalidIndex}`);
    }

    const created = [];
    for (const index of dto.selectedIndexes) {
      const row = preview.rows[index];
      const transaction = await this.transactionsService.create(userId, {
        amount: row.amount,
        description: row.description,
        date: row.date,
        categoryId: dto.categoryId,
        paymentMethodId: dto.paymentMethodId,
        accountId: dto.accountId,
        type: row.type as TransactionType,
      });
      created.push(transaction);
    }

    this.previews.delete(previewId);

    return { imported: created.length, transactions: created };
  }

  private detectFormat(fileName: string): "csv" | "xlsx" | "ofx" {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "csv") return "csv";
    if (extension === "xlsx" || extension === "xls") return "xlsx";
    if (extension === "ofx") return "ofx";
    throw new BadRequestException("Formato não suportado — use .csv, .xlsx ou .ofx");
  }

  private parse(format: "csv" | "xlsx" | "ofx", buffer: Buffer) {
    if (format === "csv") return parseCsv(buffer);
    if (format === "xlsx") return parseXlsx(buffer);
    return parseOfx(buffer);
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [id, entry] of this.previews) {
      if (now - entry.createdAt > PREVIEW_TTL_MS) {
        this.previews.delete(id);
      }
    }
  }
}
