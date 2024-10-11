import { Node } from "../types";
import { walkAst } from "./walk-ast";

export function extractFieldsFromAst(root: Node) {
  const fields = new Set<string>();

  walkAst(root, (node) => {
    if (node.type === "Reference") {
      fields.add(node.field);
    }
  });

  return fields;
}
