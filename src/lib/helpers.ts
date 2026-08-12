export const getPaddedNumber = (month: number) => {
  return month < 10 ? `0${month}` : month;
};

export const capitalize = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const isInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
  );
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const decodeBase64 = (encoded: string | null): string | null => {
  if (!encoded) return null;
  try {
    return atob(encoded);
  } catch (err) {
    console.error("Error decoding base64:", err);
    return null;
  }
};

/** Encode UTF-8 text as URL-safe base64 for share / extension links. */
export const encodeBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

/** Decode base64 that may contain UTF-8 (extension / share links). */
export const decodeBase64Utf8 = (encoded: string | null): string | null => {
  if (!encoded) return null;
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return decodeBase64(encoded);
  }
};
