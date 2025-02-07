export function getPublicURL(): string {
    return extract(window.location.href);
}
  
export function extract(path: string) {
    const parts = path.split("/");
    const adminIndex = parts.indexOf("admin");
    const rootPath = parts.slice(0, adminIndex).join("/") + "/";
    return rootPath;
}