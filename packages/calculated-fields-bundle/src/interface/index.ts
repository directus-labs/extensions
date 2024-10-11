import { defineInterface, useStores } from "@directus/extensions-sdk";
import { Relation } from "@directus/types";
import * as formulajs from "@formulajs/formulajs";
import { extractFunctionsFromAst } from "../lib/extract-functions-from-ast";
import { extractReferencesFromAst } from "../lib/extract-references-from-ast";
import { isRelationalFieldPath } from "../lib/field-helpers";
import { getAllM2ORelations } from "../lib/get-all-m2o-relations";
import { parseFormula } from "../lib/parse-formula";
import InterfaceComponent from "./interface.vue";

export default defineInterface({
  id: "calculated",
  name: "Calculated",
  icon: "functions",
  description: "Automatically compute values based on field values.",
  component: InterfaceComponent,
  options({ collection, field }) {
    let relationsStore: any = null;

    try {
      const { useRelationsStore } = useStores();
      relationsStore = useRelationsStore();
    } catch (err) {}

    const { options } = field.meta ?? {};

    let parseError = null;
    let unknownFunctions: string[] = [];
    let invalidRelations: string[] = [];

    try {
      if (options?.formula) {
        const ast = parseFormula(options?.formula);

        unknownFunctions = [...extractFunctionsFromAst(ast)].filter(
          // @ts-ignore
          (fn) => formulajs[fn] === undefined,
        );

        const relationalFields = [...extractReferencesFromAst(ast)].filter(
          isRelationalFieldPath,
        );

        if (relationsStore) {
          const relations: [string, Relation[]][] = relationalFields.map(
            (field) => [
              field,
              getAllM2ORelations(collection!, field, relationsStore),
            ],
          );

          invalidRelations = relations
            .filter(([field, relations]) => {
              const fieldKey = field.split(".").at(-1);

              const relationsInfo = relationsStore.getRelationsForField(
                relations.at(-1)!.related_collection,
                fieldKey,
              );

              return (
                relations.length !== field.split(".").length - 1 ||
                relationsInfo.length > 0
              );
            })
            .map(([field, _]) => field);
        }
      }
    } catch (err) {
      parseError = err;
    }

    return [
      {
        field: "formula",
        name: "Formula",
        type: "string",
        meta: {
          width: "full",
          interface: "system-display-template",
          options: {
            collectionName: collection,
            "data-interface-options": "calculated", // marker used for CSS overrides
            style: parseError
              ? "--v-input-border-color: var(--theme--danger); --v-input-border-color-hover: var(--theme--danger)"
              : "",
          },
        },
      },
      !!parseError && {
        field: "parseErrorNotice",
        type: "alias",
        meta: {
          width: "full",
          interface: "presentation-notice",
          options: {
            color: "danger",
            text: parseError,
            "data-interface-options": "calculated", // marker used for CSS overrides
            "data-field": "parseError",
          },
        },
      },
      unknownFunctions.length > 0 && {
        field: "functionErrorNotice",
        type: "alias",
        meta: {
          width: "full",
          interface: "presentation-notice",
          options: {
            color: "danger",
            text: `Unknown function${
              unknownFunctions.length > 1 ? "s" : ""
            }: ${unknownFunctions.join(", ")}`,
            "data-interface-options": "calculated", // marker used for CSS overrides
          },
        },
      },
      invalidRelations.length > 0 && {
        field: "invalidRelationsErrorNotice",
        type: "alias",
        meta: {
          width: "full",
          interface: "presentation-notice",
          options: {
            color: "danger",
            text: `Invalid field${
              invalidRelations.length > 1 ? "s" : ""
            } (calculated fields does not support relations other than M2O) : 

${invalidRelations.map((field) => `* ${field}`).join("\n")}`,
            "data-interface-options": "calculated", // marker used for CSS overrides
          },
        },
      },
      {
        field: "iconLeft",
        name: "$t:icon_left",
        type: "string",
        meta: {
          width: "half",
          interface: "select-icon",
        },
      },
      {
        field: "iconRight",
        name: "$t:icon_right",
        type: "string",
        meta: {
          width: "half",
          interface: "select-icon",
        },
      },
    ];
  },
  types: ["alias"],
  localTypes: ["presentation"],
  group: "presentation",
});
