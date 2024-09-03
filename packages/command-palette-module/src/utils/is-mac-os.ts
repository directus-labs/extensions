export function isMacOS() {
  return getPlatform().toLowerCase().includes("mac");
}

function getPlatform() {
  if ("userAgentData" in navigator && navigator.userAgentData) {
    // @ts-expect-error
    return navigator.userAgentData.platform;
  }

  if (navigator.platform) {
    if (
      navigator.userAgent &&
      /android/.test(navigator.userAgent.toLowerCase())
    ) {
      return "android";
    }

    return navigator.platform;
  }

  return "unknown";
}
