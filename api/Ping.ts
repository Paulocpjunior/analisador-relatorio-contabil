// /api/ping.ts
export default async function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    method: req.method,
    node: process.versions.node,
    hasApiKey: Boolean(process.env.API_KEY),
  });
}
