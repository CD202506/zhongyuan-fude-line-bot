import { isApiMode } from "../config/runtimeMode";
import { modules } from "../data/modules";
import { webAdminApi } from "../api/webAdminApi";

export async function getModules() {
  if (!isApiMode) {
    return modules;
  }

  const apiModules = await webAdminApi.getModules();
  return modules.map((moduleItem) => {
    const apiModule = apiModules.find((item) => item.key === moduleItem.key);
    return apiModule
      ? {
          ...moduleItem,
          title: apiModule.title,
          description: apiModule.description,
          boundary: apiModule.boundary,
        }
      : moduleItem;
  });
}
