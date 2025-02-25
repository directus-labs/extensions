import { Accountability } from "@directus/types";
import type { DirectusError } from '../types/extension';

const notifyUser = async (notificationService: any, accountability: Accountability, data: DirectusError): Promise<void> => {
  await notificationService.createOne({
    status: "inbox",
    subject: data.name,
    recipient: accountability.user,
    message: Array.isArray(data.errors) && data.errors.length > 0 ? data.errors[0]?.message : JSON.stringify(data),
  });
};

export default notifyUser;