export type RelationalFieldPath = `${string}.${string}`;

/**
 * Split the field into a field key and the remaining field path
 */
export function splitFieldPath(field: RelationalFieldPath): [string, string] {
  const [key, ...path] = field.split(".");
  return [key!, path.join(".")];
}

export function isRelationalFieldPath(
  field: string,
): field is RelationalFieldPath {
  return field.includes(".");
}
