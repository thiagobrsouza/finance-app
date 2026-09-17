import { IsHexColor, IsNotEmpty, IsOptional, IsUUID, MaxLength } from "class-validator";
import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {
  @ApiProperty({ example: "Pets" })
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(60)
  icon?: string;

  @ApiPropertyOptional({ example: "#319085" })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ description: "Se informado, cria como subcategoria" })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
