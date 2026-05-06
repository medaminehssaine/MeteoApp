module.exports = async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: 'BACKEND_URL is not configured' }));
    return;
  }

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path || '';
  const query = new URLSearchParams(req.query);
  query.delete('path');

  const target = new URL(`/api/v1/${path}`, backendUrl);
  query.forEach((value, key) => target.searchParams.append(key, value));

  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];

  const response = await fetch(target, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
    duplex: 'half'
  });

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
};
