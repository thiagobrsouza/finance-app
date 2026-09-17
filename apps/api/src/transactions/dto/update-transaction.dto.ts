import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateTransactionDto } from "./create-transaction.dto";

// Reestruturar parcelamento/recorrência não é suportado via PATCH — só os dados da ocorrência.
export class UpdateTransactionDto extends PartialType(OmitType(CreateTransactionDto, ["advanced"] as const)) {}
