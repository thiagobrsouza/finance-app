import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

/** Valida que o campo decorado é igual a outro campo do mesmo DTO (ex: confirmação de senha). */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: "match",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} deve ser igual a ${relatedPropertyName}`;
        },
      },
    });
  };
}
