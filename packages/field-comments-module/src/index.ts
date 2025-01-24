import { defineModule } from "@directus/extensions-sdk";
import { injectCommentsApp } from "./utils/inject-comments";
import { injectFieldLabels } from "./utils/inject-field-labels";

console.log("Init");

export default defineModule({
  id: "field-comments",
  hidden: true,
  name: "Field Comments",
  icon: "chat_bubble_outline",
  routes: [],
  preRegisterCheck() {
    injectFieldLabels();
    injectCommentsApp();
    return true;
  },
});