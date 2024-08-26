// Directus Dynamic Field Grammar
// ==============================
//
// Arithmetics and Literals based on https://github.com/peggyjs/peggy/blob/396626f208b09ca1ec6671ffe88a8ac3d8e26d01/examples/javascript.pegjs
//
// This currently accepts nested field keys like `field_a.field_b`. To disable change
// `FieldKey "field name"
//    = SimpleFieldKey / RelationFieldKey`
// to only `SimpleFieldKey`
//
// This currently accepts the spread operator in front of field references, like `...{{field}}`.
// To disable remove `SpreadFieldReference` from `Constant`


{{
  function buildBinaryExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: "BinaryExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }

  function buildArgumentList(empty, first, rest) {
    return [
    	...(empty ? Array(empty.length).fill(null) : []),
        ...(first ? [first] : []),
        ...(rest ? rest.map(([_, __, v]) => v) : [])
    ]
  }
}}

Formula = Paren / Constant / FunctionCall

UnaryExpression = operator:"-"? value:Formula { return operator && operator === '-' ? { type: "UnaryExpression", operator, value } : value }

MultiplicativeExpression
  = head:UnaryExpression
    tail:(_ MultiplicativeOperator _ UnaryExpression)*
    { return buildBinaryExpression(head, tail); }

MultiplicativeOperator
  = $("*" !"=")
  / $("/" !"=")
  / $("%" !"=")

AdditiveExpression
  = head:MultiplicativeExpression
    tail:(_ AdditiveOperator _ MultiplicativeExpression)*
    { return buildBinaryExpression(head, tail); }

AdditiveOperator
  = $("+" ![+=])
  / $("-" ![-=])

RelationalExpression
  = head:AdditiveExpression
    tail:(_ RelationalOperator _ AdditiveExpression)*
    { return buildBinaryExpression(head, tail); }

RelationalOperator
  = "<="
  / ">="
  / $("<" !"<")
  / $(">" !">")

EqualityExpression
  = head:RelationalExpression
    tail:(_ EqualityOperator _ RelationalExpression)*
    { return buildBinaryExpression(head, tail); }

EqualityOperator
  = "=="
  / "!="

Expression = EqualityExpression

Paren "parenthesis"
  = "(" exp:Expression ")" { return exp }

Constant "constant or field"
  = NumericLiteral / StringLiteral / BooleanLiteral / FieldReference

FunctionCall = name:FunctionName "(" args:Arguments ")" { return { type: "Function", name , arguments: args } }

Arguments = empty:(","*) first:Expression? rest:("," _ Expression)* { return buildArgumentList(empty, first, rest) }

FunctionName = [A-Z]+ { return text() }

FieldReference "field reference"
  = '{{' _ field:FieldKey _ '}}' { return { type: 'Reference', field } }

SpreadFieldReference "spread field reference"
  = '...{{' _ field:FieldKey _ '}}' { return { type: 'Reference', spread: true, field } }

FieldKey "field name"
  = RelationFieldKey

SimpleFieldKey "simple field name"
  = [a-zA-Z_\-]+ { return text() }

RelationFieldKey "relational field name"
  = head:SimpleFieldKey tail:("." SimpleFieldKey)* { return [head, ...tail.map(([_, k]) => k)].join('.')}

BooleanLiteral "boolean"
  = ("true"i / "false"i) { return { type: "Literal", value: text().toLowerCase() === 'true' } }

NumericLiteral "number"
  = DecimalIntegerLiteral "." DecimalDigit* {
      return { type: "Literal", value: parseFloat(text()) };
    }
  / "." DecimalDigit+ {
      return { type: "Literal", value: parseFloat(text()) };
    }
  / DecimalIntegerLiteral {
      return { type: "Literal", value: parseFloat(text()) };
    }

DecimalIntegerLiteral
  = "0"
  / NonZeroDigit DecimalDigit*

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

IntegerLiteral "integer"
  = [0-9]+ { return { type: "Literal", value: parseInt(text(), 10) } }

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "Literal", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "Literal", value: chars.join("") };
    }

DoubleStringCharacter
  = !('"' / '\\"') . { return text(); }
  / '\\"' { return '"'; }

SingleStringCharacter
  = !("'" / "\\'" ) . { return text(); }
  / "\\'" { return "'"; }

_ "whitespace"
  = [ \t\n\r]*
