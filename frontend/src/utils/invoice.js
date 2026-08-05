// Generates a print-ready HTML invoice for an order and opens it in a new
// window (self-contained inline styles so it prints cleanly anywhere).
import { formatMoney, getDeliveryLabel } from './productHelper';

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

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

export const openInvoice = (order = {}) => {
    const s = order.shippingInfo || {};
    const items = order.orderItems || [];
    const isPaid = (order.paymentInfo || {}).status === 'succeeded';
    const isCod = order.paymentMethod === 'cod';
    const methodLabel = METHOD_META[order.paymentMethod] || 'Online';
    const hasCoupon = Number(order.discountPrice) > 0;
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const paidDate = order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : orderDate;
    const deliveryLabel = getDeliveryLabel(order.deliveryDate || order._id);

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice ${esc(order._id)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #212121; background: #f5f5f5; padding: 24px; }
  .sheet { max-width: 780px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
  .inv-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 26px 30px; background: linear-gradient(135deg, #fb641b, #ff9f00); color: #fff; }
  .inv-logo { display: flex; align-items: center; gap: 10px; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
  .inv-logo i { font-size: 30px; }
  .inv-meta { text-align: right; font-size: 13px; line-height: 1.6; }
  .inv-meta b { display: block; font-size: 15px; }
  .inv-title { text-align: center; padding: 18px 30px; background: #fff7ee; color: #b34a10; font-size: 18px; font-weight: 800; letter-spacing: 1px; border-bottom: 1px dashed #e5c9a8; }
  .inv-body { padding: 26px 30px 30px; }
  .inv-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
  .inv-cols h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8a8a8a; margin-bottom: 8px; }
  .inv-cols p { font-size: 13.5px; line-height: 1.6; }
  .inv-cols p b { color: #212121; }
  .inv-flag { display: inline-block; margin-top: 8px; background: #e8f5e9; color: #2e7d32; font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
  th { background: #fff1e6; color: #b34a10; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .item-name { font-weight: 600; color: #212121; }
  .item-sub { font-size: 12px; color: #8a8a8a; margin-top: 3px; }
  .totals { margin-top: 18px; margin-left: auto; max-width: 300px; }
  .totals .row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13.5px; color: #555; border-bottom: 1px dashed #eee; }
  .totals .grand { padding: 12px 0 4px; font-size: 17px; font-weight: 800; color: #212121; border-bottom: none; }
  .totals .grand span { color: #fb641b; }
  .inv-note { margin-top: 24px; padding: 14px 16px; background: #fafafa; border: 1px dashed #e0e0e0; border-radius: 10px; font-size: 12.5px; color: #777; line-height: 1.6; }
  .inv-foot { text-align: center; padding: 16px 30px 20px; color: #9a9a9a; font-size: 11.5px; border-top: 1px solid #f0f0f0; }
  .no-print { text-align: center; margin: 0 auto 14px; max-width: 780px; }
  .no-print button { background: #fb641b; color: #fff; border: none; font-size: 14px; font-weight: 700; padding: 10px 26px; border-radius: 24px; cursor: pointer; }
  .no-print button:hover { background: #e8590c; }
  @media print { body { background: #fff; padding: 0; } .no-print { display: none; } .sheet { box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
  <div class="no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="sheet">
    <div class="inv-head">
      <div class="inv-logo"><span>&#128722;</span> VijayCart</div>
      <div class="inv-meta">
        <b>TAX INVOICE</b>
        Invoice No: ${esc(order._id)}
        <br/>Order Date: ${orderDate}
        <br/>Paid On: ${paidDate}
      </div>
    </div>
    <div class="inv-title">&#10004; ${isPaid ? 'PAID' : isCod ? 'PAY ON DELIVERY' : 'PAYMENT PENDING'} &middot; Estimated delivery by ${esc(deliveryLabel)}</div>
    <div class="inv-body">
      <div class="inv-cols">
        <div>
          <h3>Shipped To</h3>
          <p>
            <b>${esc(s.name || '')}</b><br/>
            ${esc(s.address || '')}${s.locality ? `<br/>${esc(s.locality)}` : ''}${s.landmark ? `<br/>Near: ${esc(s.landmark)}` : ''}<br/>
            ${[s.district, s.city].filter(Boolean).join(', ')}${s.city ? '' : ''}<br/>
            ${esc(s.state || '')} ${esc(s.postalCode || '')}<br/>
            ${esc(s.country || '')}<br/>
            Phone: ${esc(s.phoneNo || '')}
          </p>
        </div>
        <div>
          <h3>Billed To</h3>
          <p>
            <b>${esc((order.user && (order.user.name || order.user.email)) || s.name || '')}</b><br/>
            ${esc((order.user && order.user.email) || '')}<br/>
            Payment: <b>${isPaid ? `Paid via ${esc(methodLabel)}` : isCod ? 'Cash on Delivery' : 'Pending'}</b><br/>
            ${isPaid ? `<span class="inv-flag">Payment ID: ${esc(order.paymentInfo.id)}</span>` : ''}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Item</th><th class="num">Qty</th><th class="num">Unit Price</th><th class="num">Total</th></tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td><div class="item-name">${esc(it.name)}</div>${it.product ? `<div class="item-sub">Product ID: ${esc(it.product)}</div>` : ''}</td>
              <td class="num">${it.quantity}</td>
              <td class="num">${formatMoney(it.price)}</td>
              <td class="num"><b>${formatMoney(it.price * it.quantity)}</b></td>
            </tr>`).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${formatMoney(order.itemsPrice)}</span></div>
        <div class="row"><span>Delivery Charges</span><span>${Number(order.shippingPrice) === 0 ? 'FREE' : formatMoney(order.shippingPrice)}</span></div>
        <div class="row"><span>Tax (5%)</span><span>${formatMoney(order.taxPrice)}</span></div>
        ${hasCoupon ? `<div class="row"><span>Coupon (${esc(order.couponCode || 'Discount')})</span><span>&minus;${formatMoney(order.discountPrice)}</span></div>` : ''}
        <div class="row grand"><span>Total Amount</span><span>${formatMoney(order.totalPrice)}</span></div>
      </div>

      <div class="inv-note">
        <b>Thank you for shopping with VijayCart!</b><br/>
        7-day replacement guarantee on all items. For returns or replacements please raise a request from your order page before the window closes.
      </div>
    </div>
    <div class="inv-foot">This is a computer-generated invoice and does not require a signature. &copy; VijayCart</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) {
        alert('Please allow pop-ups to download your invoice.');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
};
