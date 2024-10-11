import { Node } from "../types";

export function walkAst(
  node: Node,
  visit: (node: Node) => void,
  order: "pre" | "post" = "pre",
) {
  if (order === "pre") visit(node);

  if (node.type === "BinaryExpression") {
    walkAst(node.left, visit);
    walkAst(node.right, visit);
  } else if (node.type === "UnaryExpression") {
    walkAst(node.value, visit);
  } else if (node.type === "Function") {
    node.arguments.forEach((arg) => walkAst(arg, visit));
  }

  if (order === "post") visit(node);
}
