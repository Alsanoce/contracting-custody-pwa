export function printReport(elementId, title = 'تقرير') {
  const report = document.getElementById(elementId);
  if (!report) return;

  const popup = window.open('', '_blank', 'width=1000,height=800');
  popup.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; color: #111827; margin: 24px; }
          h1, h2, h3 { color: #0f2742; margin: 0 0 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; vertical-align: top; }
          th { background: #f3f4f6; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
          .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
          .muted { color: #6b7280; }
          @media print { button { display: none; } body { margin: 12mm; } }
        </style>
      </head>
      <body>${report.innerHTML}</body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}
