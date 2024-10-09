import { Node } from "../types";
import { walkAst } from "./walk-ast";

export function extractReferencesFromAst(root: Node) {
  const references = new Set<string>();

  walkAst(root, (node) => {
    if (node.type === "Reference") {
      references.add(node.field);
    }
  });

  return references;
}
