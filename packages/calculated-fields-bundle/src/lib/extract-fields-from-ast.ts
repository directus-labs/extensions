import { Node } from "../types";

export function extractFieldsFromAst(
  root: Node,
  fields: Set<string> = new Set(),
) {
  if (root.type === "Reference") {
    fields.add(root.field);
  } else if (root.type === "BinaryExpression") {
    extractFieldsFromAst(root.left, fields);
    extractFieldsFromAst(root.right, fields);
  } else if (root.type === "UnaryExpression") {
    extractFieldsFromAst(root.value, fields);
  } else if (root.type === "Function") {
    root.arguments.forEach((arg) => extractFieldsFromAst(arg, fields));
  }

  console.log(fields);

  return fields;
}
