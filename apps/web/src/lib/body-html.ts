export function renderBodyHtml(body: string): string {
  if (/<[a-z][\s\S]*>/i.test(body)) {
    return body;
  }

  return body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}