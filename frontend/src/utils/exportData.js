// Dependency-free CSV / Excel export helpers for the admin panel.
// Excel export emits SpreadsheetML (.xls), which Excel/WPS/Google Sheets open
// natively without any third-party library.

const escapeCSV = value => {
    const s = value == null ? '' : String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

const toNumber = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
};

const toDate = v => {
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

const buildRows = (headers, rows) => rows.map(row => headers.map(h => row[h]));

const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const stamp = () => {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
};

export const exportCSV = (filename, headers, rows) => {
    const lines = [headers.map(h => h.label).join(',')];
    buildRows(headers, rows).forEach(row => {
        lines.push(row.map(escapeCSV).join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    download(blob, `${filename}_${stamp()}.csv`);
};

export const exportExcel = (filename, headers, rows) => {
    const sheet = [];
    sheet.push('<?xml version="1.0" encoding="UTF-8"?>');
    sheet.push('<?mso-application progid="Excel.Sheet"?>');
    sheet.push('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">');
    sheet.push('<Styles>');
    sheet.push('<Style ss:ID="hdr"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#FB641B" ss:Pattern="Solid"/></Style>');
    sheet.push('<Style ss:ID="num"><NumberFormat ss:Format="#,##0.00"/></Style>');
    sheet.push('</Styles>');
    sheet.push('<Worksheet ss:Name="Export"><Table>');
    sheet.push('<Row>');
    headers.forEach(h => {
        sheet.push(`<Cell ss:StyleID="hdr"><Data ss:Type="String">${escapeCSV(h.label)}</Data></Cell>`);
    });
    sheet.push('</Row>');
    buildRows(headers, rows).forEach((row, ri) => {
        sheet.push('<Row>');
        headers.forEach((h, ci) => {
            const raw = row[ci];
            if (h.type === 'number') {
                const n = toNumber(raw);
                if (Number.isFinite(n)) {
                    sheet.push(`<Cell ss:StyleID="num"><Data ss:Type="Number">${n}</Data></Cell>`);
                    return;
                }
            }
            if (h.type === 'date') {
                const d = toDate(raw);
                if (d) {
                    sheet.push(`<Cell><Data ss:Type="DateTime">${d.toISOString().slice(0, 19).replace('T', 'T')}</Data></Cell>`);
                    return;
                }
            }
            const s = escapeCSV(raw == null ? '' : raw).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            sheet.push(`<Cell><Data ss:Type="String">${s}</Data></Cell>`);
        });
        sheet.push('</Row>');
    });
    sheet.push('</Table></Worksheet></Workbook>');
    const blob = new Blob([sheet.join('\n')], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    download(blob, `${filename}_${stamp()}.xls`);
};
