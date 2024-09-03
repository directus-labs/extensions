import { Item } from "@directus/types";
import { isNil } from "lodash-es";
import { Component, h } from "vue";
import { useCollectionSearch } from "../../../composables/use-collection-search";

type Context = {
  info: ReturnType<typeof useCollectionSearch>["info"];
  RenderTemplate: Component;
  DisplayImage: Component;
};

export function getItemResultCommand(
  item: Item,
  { info, RenderTemplate, DisplayImage }: Context,
) {
  {
    const {
      collection,
      thumbnailField,
      descriptionField,
      displayTemplate,
      fields,
      icon: collectionIcon,
    } = info.value;
    const id = `${collection}:${item[info.value.primaryKeyField]}`;

    const icon =
      thumbnailField && item[thumbnailField]
        ? () => h(DisplayImage, { value: { id: item[thumbnailField] } })
        : collectionIcon;

    return {
      id: `search-item:${id}`,
      name: id,
      icon,
      description: descriptionField ? item[descriptionField] : undefined,
      keywords: fields
        ?.map((field) => {
          return item[field];
        })
        .filter((v) => !isNil(v)),
      render: () =>
        h(RenderTemplate, {
          collection,
          template: displayTemplate,
          item,
        }),
    };
  }
}
