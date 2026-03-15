export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8071';
  const url = new URL(request.url);

  // 构建后端请求 URL
  const targetUrl = `${backendUrl}${url.pathname}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'manual',
    });

    // 处理流式响应
    const contentType = response.headers.get('content-type') || '';
    const isStream = contentType.includes('text/event-stream') || contentType.includes('application/x-ndjson');

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        ...(isStream ? { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } : {}),
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: true, message: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
