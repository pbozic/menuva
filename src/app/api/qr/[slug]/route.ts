import QRCode from "qrcode";

/** QR code (SVG) pointing at the public menu or daily page. ?format=png for a PNG to print, ?target=daily for /d/. */
export async function GET(req: Request, ctx: RouteContext<"/api/qr/[slug]">) {
  const { slug } = await ctx.params;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const q = new URL(req.url).searchParams;
  // ?target=daily → today's malica page (/d/...), otherwise the full menu (/m/...)
  const path = q.get("target") === "daily" ? "d" : "m";
  const target = `${origin}/${path}/${encodeURIComponent(slug)}`;
  const format = q.get("format");

  if (format === "png") {
    const png = await QRCode.toBuffer(target, { width: 1024, margin: 2, errorCorrectionLevel: "M" });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${path === "d" ? "malica" : "menu"}-qr-${slug}.png"`,
      },
    });
  }

  const svg = await QRCode.toString(target, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
