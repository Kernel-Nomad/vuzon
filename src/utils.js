import 'dotenv/config';

const CF_API_URL = 'https://api.cloudflare.com/client/v4';

export const cfHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.CF_API_TOKEN}`
});

export async function fetchCloudflare(path, method = 'GET', body = null) {
  const url = `${CF_API_URL}${path}`;
  const options = {
    method,
    headers: cfHeaders(),
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json();
  
  if (!res.ok || !data.success) {
    const msg = data.errors?.[0]?.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data.result;
}

export async function fetchAllCloudflare(path) {
  let allResults = [];
  let page = 1;
  let totalPages = 1;
  
  const separator = path.includes('?') ? '&' : '?';

  do {
    const url = `${CF_API_URL}${path}${separator}page=${page}&per_page=50`;
    const res = await fetch(url, { headers: cfHeaders() });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.errors?.[0]?.message || `Error ${res.status}`;
      throw new Error(msg);
    }

    if (data.result) {
      allResults = allResults.concat(data.result);
    }
    
    if (data.result_info) {
      totalPages = data.result_info.total_pages;
    }
    
    page++;
  } while (page <= totalPages);

  return allResults;
}
