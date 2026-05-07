export const exportToCSV = (data, headers, filename) => {
  if (!data.length) return;
  const csv = [headers, ...data.map(row => headers.map(h => '"' + (row[h] || '') + '"'))].map(r => r.join(',')).join('\n');
  const b = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(u);
};