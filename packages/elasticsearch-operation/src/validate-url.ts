export default function isValidUrl(string: string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    console.warn(_);
    return false;  
  }
  return url.protocol === "http:" || url.protocol === "https:";
}