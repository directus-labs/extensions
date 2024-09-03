import { VNode } from "vue";

export function getTextContent(
  ...els: (string | HTMLElement | VNode | undefined | null)[]
) {
  const result = els
    .filter((el) => el)
    .map((el) => {
      if (typeof el === "string") {
        return el.trim();
      }

      if (el instanceof HTMLElement) {
        return el.textContent?.replace(/\n/g, " ").trim();
      }

      if (el && el.el) {
        return el.el.textContent?.replace(/\n/g, " ").trim();
      }

      return "";
    })
    .join(" ")
    .trim();

  return result;
}
