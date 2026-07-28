import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records a scan for the public /r/[shortCode] redirect. Fire-and-forget: the
 * request data is captured synchronously, then the DB write is deferred with
 * after() so it runs AFTER the redirect response is sent — redirect latency
 * stays flat. Any failure is swallowed; analytics must never break a redirect.
 */

type DeviceType = "desktop" | "mobile" | "tablet";
type Os = "windows" | "macos" | "linux" | "android" | "ios" | "other";
type Browser = "chrome" | "firefox" | "safari" | "edge" | "other";

function parseBrowser(ua: string): Browser {
  if (/edg/i.test(ua)) return "edge"; // must precede chrome — Edge UA contains "Chrome"
  if (/firefox|fxios/i.test(ua)) return "firefox";
  if (/chrome|crios|chromium/i.test(ua)) return "chrome";
  if (/safari/i.test(ua)) return "safari";
  return "other";
}

function parseOs(ua: string): Os {
  if (/windows/i.test(ua)) return "windows";
  if (/android/i.test(ua)) return "android"; // before linux — Android UA says "Linux; Android"
  if (/iphone|ipad|ipod|ios/i.test(ua)) return "ios";
  if (/mac os|macintosh/i.test(ua)) return "macos";
  if (/linux/i.test(ua)) return "linux";
  return "other";
}

function parseDeviceType(ua: string): DeviceType {
  // Android tablets omit "Mobile"; iPad is a tablet
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function recordScan(qrCodeId: string, request: Request): void {
  // capture everything synchronously — the request may be unusable after response
  const h = request.headers;
  const ua = h.get("user-agent") ?? "";
  const ip = clientIp(h);
  const rawCountry =
    h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null;
  const referrer = h.get("referer");
  const url = new URL(request.url);

  const country =
    rawCountry && rawCountry !== "XX" ? rawCountry.toUpperCase() : null;
  const deviceType = parseDeviceType(ua);
  const os = parseOs(ua);
  const browser = parseBrowser(ua);
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const utmCampaign = url.searchParams.get("utm_campaign");
  const salt = process.env.SCAN_IP_SALT ?? "";

  after(async () => {
    try {
      const ipHash = await sha256Hex(`${ip}:${salt}`);
      const supabase = createAdminClient();
      await supabase.rpc("record_scan", {
        p_qr_code_id: qrCodeId,
        p_ip_hash: ipHash,
        p_country: country,
        p_device_type: deviceType,
        p_os: os,
        p_browser: browser,
        p_referrer: referrer,
        p_utm_source: utmSource,
        p_utm_medium: utmMedium,
        p_utm_campaign: utmCampaign,
      });
    } catch {
      // swallow — a failed scan write must never surface on the redirect
    }
  });
}
