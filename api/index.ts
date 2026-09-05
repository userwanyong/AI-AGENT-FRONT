import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8071';
  const targetUrl = `${backendUrl}${req.url}`;

  try {
    // 构建请求头，过滤掉 host 和 content-length（转发前按实际 body 重算）
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
        headers[key] = Array.isArray(value) ? value[0] : value || '';
      }
    }

    // 原样透传原始请求体。注意：不要访问 req.body——Vercel 不会解析
    // multipart/form-data，访问后拿不到内容；直接读原始流才能保留二进制 part。
    let body: Buffer | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      body = Buffer.concat(chunks);
      headers['content-length'] = String(body.length);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body ? new Uint8Array(body) : undefined,
      redirect: 'manual',
    });

    const contentType = response.headers.get('content-type') || '';
    const isStream = contentType.includes('text/event-stream') || contentType.includes('application/x-ndjson');

    // 3xx 重定向：透传 Location，让浏览器继续跳转（OAuth authorize 等依赖 302）
    const location = response.headers.get('location');
    if (location && response.status >= 300 && response.status < 400) {
      res.setHeader('Location', location);
      res.status(response.status).end();
      return;
    }

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (isStream) {
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      }
      res.end();
      return;
    }

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(502).json({ error: true, message: error.message });
  }
}
