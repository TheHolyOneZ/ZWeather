export function isLinux(): boolean {
  if (typeof navigator === "undefined") return false;
  return /linux/i.test(navigator.userAgent) && !/android/i.test(navigator.userAgent);
}

export function isMacOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /mac/i.test(navigator.userAgent) && !/iphone|ipad/i.test(navigator.userAgent);
}

export function isWindows(): boolean {
  if (typeof navigator === "undefined") return false;
  return /windows/i.test(navigator.userAgent);
}
