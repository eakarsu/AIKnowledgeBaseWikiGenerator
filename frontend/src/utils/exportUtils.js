export const exportToCSV = (data, columns, filename = 'export.csv') => {
  if (!data || data.length === 0) return;

  const header = columns.map(c => c.label).join(',');
  const rows = data.map(item =>
    columns.map(c => {
      let val = c.accessor ? c.accessor(item) : item[c.key];
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val}"`;
      }
      return val;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (title, data, columns) => {
  if (!data || data.length === 0) return;

  const rows = data.map(item =>
    columns.map(c => {
      const val = c.accessor ? c.accessor(item) : item[c.key];
      return val !== null && val !== undefined ? String(val) : '';
    })
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 2rem; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #6B7280; margin-bottom: 1.5rem; font-size: 0.875rem; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #F3F4F6; text-align: left; padding: 0.5rem 0.75rem; font-size: 0.75rem; text-transform: uppercase; border-bottom: 2px solid #E5E7EB; }
        td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #E5E7EB; font-size: 0.875rem; }
        tr:nth-child(even) { background: #F9FAFB; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Exported on ${new Date().toLocaleDateString()} - ${data.length} records</p>
      <table>
        <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
};
