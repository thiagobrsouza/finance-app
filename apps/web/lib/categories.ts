import type { Category } from "./types";

/** Achata a árvore de categorias (nível 1 + subcategorias) para uso num <select>. */
export function flattenCategories(categories: Category[]): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const category of categories) {
    result.push({ id: category.id, label: category.name });
    for (const child of category.children ?? []) {
      result.push({ id: child.id, label: `— ${child.name}` });
    }
  }
  return result;
}
