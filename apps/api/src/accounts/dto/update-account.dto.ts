import { PartialType, OmitType } from "@nestjs/swagger";
import { CreateAccountDto } from "./create-account.dto";

// Saldo não é editável diretamente por aqui — só via transações/transferências.
export class UpdateAccountDto extends PartialType(OmitType(CreateAccountDto, ["initialBalance"] as const)) {}
