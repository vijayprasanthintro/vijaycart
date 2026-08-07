// Generates a print-ready, PDF-friendly GST invoice for an order and opens it
// in a new window. The document is fully self-contained (inline styles + SVG)
// so it renders and prints identically on every device, with a QR verification
// code generated locally via the `qrcode` package.
import { formatMoney, getDeliveryLabel } from './productHelper';
import QRCode from 'qrcode';

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

// ---------------------------------------------------------------------------
// Company profile — edit these to match the business.
// ---------------------------------------------------------------------------
const COMPANY = {
    name: 'VijayCart',
    tagline: 'Marketplace',
    address: ['#12, MG Road, Bengaluru', 'Karnataka 560001, India'],
    email: 'help@vijaycart.com',
    phone: '+91 82204 77466',
    gstin: '29ABCDE1234F1Z5',
    cin: 'U52590KA2016PTC123456',
    signatory: 'Authorized Signatory',
};

const GST_RATE = 5; // total GST %
const CGST_RATE = GST_RATE / 2;
const SGST_RATE = GST_RATE / 2;

const INSTRUCTIONS = ['Leave at the front door', 'Call before delivery', 'Leave with neighbor', 'Deliver between 9AM - 6PM', 'Do not ring the doorbell', 'None'];

const METHOD_META = {
    upi: 'UPI',
    card: 'Credit / Debit Card',
    netbanking: 'Net Banking',
    wallet: 'VijayCart Wallet',
    cod: 'Cash on Delivery',
};

export const instructionLabel = (key) => {
    if (!key) return '';
    return INSTRUCTIONS.find(i => i === key) || key;
};

const fmtDate = (d, opts = {}) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', ...opts });
    } catch { return '—'; }
};

const shortId = (id) => {
    const s = String(id || '');
    return s.length > 8 ? `#${s.slice(-8).toUpperCase()}` : s;
};

// Indian numeral system: number -> words, e.g. 1,23,456 -> "One Lakh Twenty
// Three Thousand Four Hundred Fifty Six Rupees Only".
const AMOUNT_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const AMOUNT_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const amountTwo = (x) => x < 20 ? AMOUNT_ONES[x] : (AMOUNT_TENS[Math.floor(x / 10)] + (x % 10 ? ' ' + AMOUNT_ONES[x % 10] : ''));
const amountThree = (x) => (Math.floor(x / 100) ? AMOUNT_ONES[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? amountTwo(x % 100) : '');

export const amountToWords = (num) => {
    const raw = Number(num) || 0;
    const rupees = Math.floor(Math.abs(raw));
    const paise = Math.round((Math.abs(raw) - rupees) * 100);
    const crore = Math.floor(rupees / 10000000);
    let rem = rupees % 10000000;
    const lakh = Math.floor(rem / 100000); rem %= 100000;
    const thousand = Math.floor(rem / 1000); rem %= 1000;
    let out = '';
    if (crore) out += amountTwo(crore) + ' Crore ';
    if (lakh) out += amountTwo(lakh) + ' Lakh ';
    if (thousand) out += amountTwo(thousand) + ' Thousand ';
    if (rem) out += amountThree(rem);
    const words = (out.trim() || 'Zero') + ' Rupees';
    return paise ? `${words} and ${amountTwo(paise)} Paise Only` : `${words} Only`;
};

const COMPANY_LOGO = `
<svg width="50" height="50" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="48" height="48" rx="12" fill="#fb641b"/>
  <path d="M15 17.5h18l-1.55 16.9a3.2 3.2 0 0 1-3.18 3.0h-8.54a3.2 3.2 0 0 1-3.18-3.0L15 17.5z" fill="#fff"/>
  <path d="M18.8 19.5v-2.2a5.2 5.2 0 0 1 10.4 0v2.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
</svg>`;

// Escaped (one-line) version of the logo for reuse inside <img>-free markup.
const LOGO_BLOCK = `<div class="inv-brand"><span class="inv-brand-mark">${COMPANY_LOGO}</span><span class="inv-brand-text"><b>${esc(COMPANY.name)}</b><span>${esc(COMPANY.tagline)}</span></span></div>`;

const QR_PLACEHOLDER = `<div class="qr"><div class="qr-box"><i>&#128247;</i></div><span>QR unavailable</span></div>`;

export const openInvoice = async (order = {}) => {
    // Open the window synchronously (inside the click gesture) so popup
    // blockers don't reject it; the real content is written after the QR is
    // generated below.
    const win = window.open('', '_blank', 'width=960,height=1000');
    if (!win) {
        alert('Please allow pop-ups to download your invoice.');
        return;
    }
    win.document.open();
    win.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Preparing invoice…</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;background:#eef1f6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#1a2333}
.spin{width:34px;height:34px;border:4px solid #ffd9c2;border-top-color:#fb641b;border-radius:50%;animation:r 1s linear infinite;margin:0 auto 12px}
@keyframes r{to{transform:rotate(360deg)}}p{font-size:14px;text-align:center;color:#6b7484}</style>
</head>
<body><div><div class="spin"></div><p>Preparing your invoice…</p></div></body>
</html>`);
    win.document.close();

    const s = order.shippingInfo || {};
    const items = order.orderItems || [];
    const isPaid = (order.paymentInfo || {}).status === 'succeeded';
    const isCod = order.paymentMethod === 'cod';
    const methodLabel = METHOD_META[order.paymentMethod] || 'Online';
    const hasCoupon = Number(order.discountPrice) > 0;

    const orderNo = order.orderNumber || String(order._id || '');
    const invoiceNo = `INV-${order.orderNumber || shortId(order._id || '')}`;
    const orderDate = fmtDate(order.createdAt);
    const paidDate = fmtDate(order.paidAt || order.createdAt);
    const deliveryDate = order.deliveredAt
        ? fmtDate(order.deliveredAt)
        : (order.deliveryDate ? fmtDate(order.deliveryDate) : getDeliveryLabel(order._id));
    const deliveryCaption = order.deliveredAt ? 'Delivered On' : 'Expected Delivery';

    const tax = Number(order.taxPrice) || 0;
    const cgst = tax / 2;
    const sgst = tax / 2;
    const total = Number(order.totalPrice) || 0;

    // QR verification payload (self-contained, no network required).
    const qrPayload = `VIJAYCART|${invoiceNo}|${orderNo}|${total.toFixed(2)}|${isPaid ? 'PAID' : isCod ? 'COD' : 'PENDING'}`;
    let qrData = '';
    try {
        qrData = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: 'M',
            width: 220,
            margin: 1,
            color: { dark: '#1a2333', light: '#ffffff' },
        });
    } catch { qrData = ''; }

    const customerName = esc((order.user && (order.user.name || order.user.email)) || s.name || '');
    const customerEmail = esc((order.user && order.user.email) || '');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Tax Invoice ${esc(invoiceNo)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    background: #eef1f6; color: #1a2333; padding: 22px 14px; font-size: 13px; line-height: 1.5;
  }
  .sheet { max-width: 820px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 34px rgba(20,30,50,.12); }
  .topbar { height: 6px; background: linear-gradient(90deg, #fb641b, #ff9f00 55%, #1a2333); }

  /* ---------- Header ---------- */
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; padding: 26px 34px 22px; flex-wrap: wrap; border-bottom: 1px solid #eef0f4; }
  .inv-brand { display: flex; align-items: center; gap: 13px; }
  .inv-brand-mark { display: block; }
  .inv-brand-text { display: flex; flex-direction: column; }
  .inv-brand-text b { font-size: 24px; font-weight: 800; letter-spacing: -0.3px; color: #1a2333; line-height: 1.05; }
  .inv-brand-text b i { font-style: normal; color: #fb641b; }
  .inv-brand-text span { font-size: 10.5px; text-transform: uppercase; letter-spacing: 2px; color: #8a93a3; }
  .inv-company { margin-top: 9px; font-size: 10.5px; color: #6b7484; line-height: 1.55; }
  .inv-company b { color: #1a2333; }
  .head-right { text-align: right; }
  .doc-title { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #fb641b; font-weight: 800; }
  .head-meta { margin-top: 10px; min-width: 250px; }
  .hm-row { display: flex; justify-content: space-between; gap: 16px; padding: 3.5px 0; font-size: 11.5px; border-bottom: 1px dashed #eef0f4; }
  .hm-row:last-child { border-bottom: none; }
  .hm-row span { color: #8a93a3; }
  .hm-row b { color: #1a2333; font-weight: 600; }

  /* ---------- Status banner ---------- */
  .status { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin: 22px 34px 0; padding: 12px 18px; border-radius: 12px; font-size: 12px; }
  .status.paid { background: #ecfdf3; border: 1px solid #b7ecd0; color: #0c7a3c; }
  .status.cod { background: #fff4ec; border: 1px solid #ffd9bd; color: #b24a07; }
  .status.pending { background: #f4f6f8; border: 1px solid #e2e6ec; color: #5a6472; }
  .status b { font-size: 13px; }
  .status .amt-words { font-size: 11px; opacity: .9; text-align: right; }

  /* ---------- Body ---------- */
  .body { padding: 24px 34px 8px; }
  .sec-title { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.6px; color: #8a93a3; margin-bottom: 10px; font-weight: 800; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
  .addr h3 { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.6px; color: #8a93a3; margin-bottom: 10px; font-weight: 800; }
  .addr h3 i { color: #fb641b; font-style: normal; margin-right: 5px; }
  .addr p { font-size: 12.5px; color: #3c4557; line-height: 1.6; }
  .addr p b { color: #1a2333; }
  .addr .tag { display: inline-block; margin-top: 8px; font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
  .tag.gst { background: #fff4ec; color: #b24a07; }
  .tag.green { background: #ecfdf3; color: #0c7a3c; }

  /* ---------- Table ---------- */
  table { width: 100%; border-collapse: collapse; margin-top: 22px; }
  thead th { background: #1a2333; color: #fff; text-align: left; padding: 11px 14px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 1px; }
  thead th:first-child { border-top-left-radius: 10px; }
  thead th:last-child { border-top-right-radius: 10px; }
  tbody td { padding: 12px 14px; border-bottom: 1px solid #f0f2f6; vertical-align: top; font-size: 12.5px; color: #3c4557; }
  tbody tr:nth-child(even) { background: #fafbfd; }
  .item-name { font-weight: 700; color: #1a2333; }
  .item-sub { font-size: 10.5px; color: #9aa1af; margin-top: 3px; }
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }

  /* ---------- Totals + signature ---------- */
  .bottom { display: grid; grid-template-columns: 1.15fr .85fr; gap: 30px; margin-top: 26px; align-items: stretch; }
  .totals { margin-left: auto; max-width: 320px; width: 100%; }
  .t-row { display: flex; justify-content: space-between; padding: 6.5px 0; font-size: 12.5px; color: #3c4557; border-bottom: 1px dashed #eef0f4; }
  .t-row b { color: #1a2333; }
  .t-row.discount span:last-child { color: #0c7a3c; font-weight: 700; }
  .t-row.grand { margin-top: 8px; padding: 12px 14px; background: #1a2333; color: #fff; border-radius: 10px; border-bottom: none; align-items: center; }
  .t-row.grand span:first-child { font-size: 13px; font-weight: 700; letter-spacing: .5px; }
  .t-row.grand span:last-child { font-size: 17px; font-weight: 800; color: #ffd28a; }
  .in-words { margin-top: 10px; font-size: 11px; color: #6b7484; font-style: italic; line-height: 1.5; }
  .in-words b { color: #1a2333; font-style: normal; }

  .sign-qr { display: flex; flex-direction: column; justify-content: space-between; gap: 18px; }
  .qr-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 1px dashed #d6dbe4; border-radius: 12px; padding: 14px; background: #fafbfd; }
  .qr-box img { width: 118px; height: 118px; }
  .qr-box .qr-cap { font-size: 10px; color: #8a93a3; text-transform: uppercase; letter-spacing: 1px; }
  .qr-box .qr-cap b { color: #1a2333; display: block; text-transform: none; letter-spacing: 0; font-size: 11px; }
  .sign { border: 1px solid #eef0f4; border-radius: 12px; padding: 16px 18px; }
  .sign .sig-line { margin: 26px 0 8px; border-top: 1.6px solid #1a2333; width: 58%; padding-top: 6px; font-size: 10.5px; color: #5a6472; }
  .sign b { color: #1a2333; font-size: 13px; }
  .sign p { font-size: 11px; color: #6b7484; }

  /* ---------- Terms ---------- */
  .terms { margin: 26px 0 0; padding: 16px 18px; background: #f7f9fc; border: 1px solid #eef0f4; border-radius: 12px; }
  .terms h3 { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.6px; color: #8a93a3; margin-bottom: 8px; font-weight: 800; }
  .terms ul { list-style: none; }
  .terms li { font-size: 11px; color: #5a6472; line-height: 1.7; padding-left: 16px; position: relative; }
  .terms li::before { content: ''; position: absolute; left: 2px; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: #fb641b; }

  /* ---------- Footer ---------- */
  .foot { margin-top: 26px; padding: 18px 34px; background: #1a2333; color: #aeb6c4; font-size: 11px; display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
  .foot b { color: #fff; }
  .foot a { color: #ffd28a; text-decoration: none; }
  .foot .gen { text-align: right; }

  /* ---------- Toolbar (never printed) ---------- */
  .toolbar { max-width: 820px; margin: 0 auto 16px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .btn { border: none; cursor: pointer; border-radius: 999px; padding: 11px 26px; font-size: 13px; font-weight: 800; letter-spacing: .3px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(20,30,50,.16); transition: transform .12s, box-shadow .12s; }
  .btn:hover { transform: translateY(-1px); }
  .btn i { font-style: normal; font-size: 15px; }
  .btn-pdf { background: #fb641b; color: #fff; }
  .btn-print { background: #fff; color: #1a2333; border: 1.5px solid #d6dbe4; box-shadow: none; }

  /* ---------- Print ---------- */
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none; }
    .sheet { box-shadow: none; border-radius: 0; max-width: 100%; }
    .topbar { height: 4px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .bottom, .cols { page-break-inside: avoid; }
    @page { margin: 12mm; }
  }

  /* ---------- Mobile ---------- */
  @media (max-width: 640px) {
    body { padding: 0; }
    .sheet { border-radius: 0; }
    .head, .body { padding-left: 18px; padding-right: 18px; }
    .head-right, .head { text-align: left; }
    .head { flex-direction: column; }
    .head-meta { min-width: 0; width: 100%; }
    .status { margin-left: 18px; margin-right: 18px; }
    .cols { grid-template-columns: 1fr; gap: 18px; }
    .bottom { grid-template-columns: 1fr; }
    .totals { max-width: none; }
    thead th, tbody td { padding: 9px 8px; }
    .foot { padding: 16px 18px; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn btn-pdf" onclick="window.print()"><i>&#128196;</i> Download PDF</button>
    <button class="btn btn-print" onclick="window.print()"><i>&#128438;</i> Print Invoice</button>
  </div>
  <div class="sheet">
    <div class="topbar"></div>

    <div class="head">
      <div>
        ${LOGO_BLOCK}
        <div class="inv-company">
          <b>${esc(COMPANY.name)} ${esc(COMPANY.tagline)}</b> &middot; ${esc(COMPANY.address[0])}, ${esc(COMPANY.address[1])}<br/>
          CIN: ${esc(COMPANY.cin)} &nbsp;|&nbsp; GSTIN: <b>${esc(COMPANY.gstin)}</b><br/>
          ${esc(COMPANY.email)} &nbsp;|&nbsp; ${esc(COMPANY.phone)}
        </div>
      </div>
      <div class="head-right">
        <div class="doc-title">Tax Invoice</div>
        <div class="head-meta">
          <div class="hm-row"><span>Invoice No.</span><b>${esc(invoiceNo)}</b></div>
          <div class="hm-row"><span>Order No.</span><b>${esc(orderNo)}</b></div>
          <div class="hm-row"><span>Order Date</span><b>${orderDate}</b></div>
          <div class="hm-row"><span>${deliveryCaption}</span><b>${deliveryDate}</b></div>
          <div class="hm-row"><span>GSTIN</span><b>${esc(COMPANY.gstin)}</b></div>
        </div>
      </div>
    </div>

    <div class="status ${isPaid ? 'paid' : isCod ? 'cod' : 'pending'}">
      <span><b>${isPaid ? '&#10003; PAID' : isCod ? '&#128176; PAY ON DELIVERY' : '&#8987; PAYMENT PENDING'}</b>
        &nbsp;&middot;&nbsp; ${esc(methodLabel)}
        ${isPaid && order.paymentInfo && order.paymentInfo.id ? ` &middot; Payment ID: ${esc(order.paymentInfo.id)}` : ''}
      </span>
      <span class="amt-words">Amount in words:<br/><b>${esc(amountToWords(total))}</b></span>
    </div>

    <div class="body">
      <div class="cols">
        <div class="addr">
          <h3><i>&#9203;</i> Order Date</h3>
          <p><b>${orderDate}</b><br/>Payment recorded on ${paidDate}.</p>
        </div>
        <div class="addr">
          <h3><i>&#11088;</i> ${deliveryCaption}</h3>
          <p><b>${deliveryDate}</b>${isCod ? '<br/><span class="tag gst">Cash to be collected at delivery</span>' : ''}</p>
        </div>
      </div>

      <div class="cols" style="margin-top:24px;">
        <div class="addr">
          <h3><i>&#128101;</i> Bill To / Customer</h3>
          <p>
            <b>${customerName}</b><br/>
            ${customerEmail ? `${customerEmail}<br/>` : ''}
            Phone: ${esc(s.phoneNo || '—')}<br/>
            GSTIN (Customer): <span class="tag green">NA</span>
          </p>
        </div>
        <div class="addr">
          <h3><i>&#128666;</i> Ship To</h3>
          <p>
            <b>${esc(s.name || customerName || '')}</b><br/>
            ${esc(s.address || '')}${s.locality ? `<br/>${esc(s.locality)}` : ''}${s.landmark ? `<br/>Near: ${esc(s.landmark)}` : ''}<br/>
            ${[s.district, s.city].filter(Boolean).join(', ')}${s.district || s.city ? '<br/>' : ''}
            ${esc(s.state || '')} ${esc(s.postalCode || '')}<br/>
            ${esc(s.country || 'India')}<br/>
            Phone: ${esc(s.phoneNo || '—')}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Rate</th>
            <th class="num">GST ${GST_RATE}%</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td>
                <div class="item-name">${esc(it.name)}</div>
                <div class="item-sub">Product ID: ${esc(it.product)}</div>
              </td>
              <td class="num">${it.quantity}</td>
              <td class="num">${formatMoney(it.price)}</td>
              <td class="num">${formatMoney(Number(it.price) * (GST_RATE / 100))}</td>
              <td class="num"><b>${formatMoney(it.price * it.quantity)}</b></td>
            </tr>`).join('')}
        </tbody>
      </table>

      <div class="bottom">
        <div class="sign-qr">
          <div class="sign">
            <b>For ${esc(COMPANY.name)}</b>
            <div class="sig-line">${esc(COMPANY.signatory)}</div>
            <p>${esc(COMPANY.name)} ${esc(COMPANY.tagline)}</p>
            <p>${esc(COMPANY.address[0])}, ${esc(COMPANY.address[1])}</p>
          </div>
          <div class="qr-box">
            ${qrData ? `<img src="${qrData}" alt="Invoice QR code" />` : QR_PLACEHOLDER}
            <span class="qr-cap">Scan to verify invoice<b>${esc(invoiceNo)}</b></span>
          </div>
        </div>

        <div class="totals">
          <div class="t-row"><span>Subtotal (${items.reduce((a, it) => a + it.quantity, 0)} items)</span><span>${formatMoney(order.itemsPrice)}</span></div>
          ${hasCoupon ? `<div class="t-row discount"><span>Discount ${order.couponCode ? `(${esc(order.couponCode)})` : ''}</span><span>&minus;${formatMoney(order.discountPrice)}</span></div>` : ''}
          <div class="t-row"><span>Delivery Charges</span><span>${Number(order.shippingPrice) === 0 ? 'FREE' : formatMoney(order.shippingPrice)}</span></div>
          <div class="t-row"><span>CGST (${CGST_RATE}%)</span><span>${formatMoney(cgst)}</span></div>
          <div class="t-row"><span>SGST (${SGST_RATE}%)</span><span>${formatMoney(sgst)}</span></div>
          <div class="t-row grand"><span>Grand Total</span><span>${formatMoney(total)}</span></div>
          <div class="in-words"><b>${esc(amountToWords(total))}</b></div>
        </div>
      </div>

      <div class="terms">
        <h3>Terms &amp; Conditions</h3>
        <ul>
          <li>Goods once sold cannot be taken back unless damaged or defective at the time of delivery.</li>
          <li>7-day replacement guarantee applies on all items; raise a request from your order page.</li>
          <li>All prices are inclusive of GST ${GST_RATE}% (CGST ${CGST_RATE}% + SGST ${SGST_RATE}%).</li>
          <li>Delivery timelines are estimates and may vary with courier availability and location.</li>
          <li>For COD orders, the delivery partner will collect the amount shown as Grand Total above.</li>
          <li>This is a computer-generated invoice and is valid without a physical signature.</li>
        </ul>
      </div>
    </div>

    <div class="foot">
      <div>
        <b>${esc(COMPANY.name)} ${esc(COMPANY.tagline)}</b><br/>
        ${esc(COMPANY.address[0])}, ${esc(COMPANY.address[1])}<br/>
        <a href="mailto:${esc(COMPANY.email)}">${esc(COMPANY.email)}</a> &nbsp;|&nbsp; ${esc(COMPANY.phone)}
      </div>
      <div class="gen">
        Generated on ${fmtDate(new Date(), { hour: '2-digit', minute: '2-digit' })}<br/>
        Invoice No: ${esc(invoiceNo)} &nbsp;|&nbsp; GSTIN: ${esc(COMPANY.gstin)}
      </div>
    </div>
  </div>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
};
