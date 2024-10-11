# Calculated Fields Bundle

Automatically calculate values based on other field values. 

Currently only an interface is provided in this bundle. Values are only visible in the interface and not in API responses.

![A number of examples showing how calculated fields can be used to derive values from other fields.](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/calculated-fields-bundle/screenshot.png)

## Features

* Display a calculated value based on any number of fields of an item.
* Supports the full set of functions provided by [Formula.js](https://formulajs.info/).
* Supports a majority of JavaScript operators that work for numbers and strings.
* Use any M2O related fields in addition to root level fields.

## Example Forumlas

Determine if a `{{date_time}}` field is in a leap year:

```
CONCATENATE(YEAR({{date_time}}), " ", IF(YEAR({{date_time}}) % 4 == 0, "is a leap year", "is not a leap year"))
```

Uppercase the value of a relational `{{title}}` field:

```
UPPER({{article.title}})
```

