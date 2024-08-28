import { Node } from "../types";
import { walkAst } from "./walk-ast";

export function extractFunctionsFromAst(root: Node) {
  const functions = new Set<string>();

  walkAst(root, (node) => {
    if (node.type === "Function") {
      functions.add(node.name);
    }
  });

  return functions;
}
