interface BaseNode<T extends string> {
  type: T;
}

export interface LiteralNode extends BaseNode<"Literal"> {
  value: string | number | boolean;
}

export interface FunctionNode extends BaseNode<"Function"> {
  name: string;
  arguments: Node[];
}

export interface ReferenceNode extends BaseNode<"Reference"> {
  field: string;
}

export type MultiplicativeOperator = "*" | "/" | "%";
export type AdditiveOperator = "+" | "-";
export type RelationalOperator = "<" | "<=" | ">" | ">=";
export type EqualityOperator = "==" | "!=";
export type BinaryOperator =
  | MultiplicativeOperator
  | AdditiveOperator
  | RelationalOperator
  | EqualityOperator;

export interface BinaryExpressionNode extends BaseNode<"BinaryExpression"> {
  operator: BinaryOperator;
  left: Node;
  right: Node;
}

export interface UnaryExpressionNode extends BaseNode<"UnaryExpression"> {
  operator: "-";
  value: Node;
}

export type Node =
  | LiteralNode
  | FunctionNode
  | ReferenceNode
  | BinaryExpressionNode
  | UnaryExpressionNode;
