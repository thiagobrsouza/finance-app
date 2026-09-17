import { PartialType, OmitType } from "@nestjs/swagger";
import { CreateCategoryDto } from "./create-category.dto";

// Não dá pra mover uma subcategoria de pai por aqui — mantém simples (editar nome/ícone/cor).
export class UpdateCategoryDto extends PartialType(OmitType(CreateCategoryDto, ["parentId"] as const)) {}
