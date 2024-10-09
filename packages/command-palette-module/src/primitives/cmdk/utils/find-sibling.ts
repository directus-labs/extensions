export function findNextSibling(el: Element, selector: string) {
  let sibling = el.nextElementSibling;

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.nextElementSibling;
  }

  return null;
}

export function findPreviousSibling(el: Element, selector: string) {
  let sibling = el.previousElementSibling;

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.previousElementSibling;
  }

  return null;
}
