import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { adminOrders as adminOrdersAction } from "../../actions/orderActions"
import { assignOrder, getDeliveryBoys } from "../../actions/deliveryActions"
import { clearUpdateDelivery } from "../../slices/deliverySlice"
import { toast } from 'react-toastify'
import Loader from '../layouts/Loader';
import { toINR } from './Charts'
import { statusBadge } from '../../utils/orderStatuses'

export default function AssignDelivery() {
    const { adminOrders = [], loading: orderLoading } = useSelector(state => state.orderState)
    const { deliveryBoys = [], loading: dbLoading, error, isUpdated } = useSelector(state => state.deliveryState)
    const dispatch = useDispatch();

    const [selected, setSelected] = useState({});
    const [assigning, setAssigning] = useState(null);

    useEffect(() => {
        dispatch(adminOrdersAction())
        dispatch(getDeliveryBoys())
    }, [dispatch])

    useEffect(() => {
        if (error) {
            toast(error, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
                onOpen: () => dispatch(clearUpdateDelivery())
            })
        }
    }, [error, dispatch])

    useEffect(() => {
        if (isUpdated) {
            toast('Delivery boy assigned', {
                type: 'success',
                position: toast.POSITION.BOTTOM_CENTER,
                onOpen: () => {
                    dispatch(clearUpdateDelivery())
                    dispatch(adminOrdersAction())
                }
            })
        }
    }, [isUpdated, dispatch])

    const handleAssign = async (orderId) => {
        if (!selected[orderId]) {
            toast('Please select a delivery boy first', { type: 'warning', position: toast.POSITION.BOTTOM_CENTER })
            return
        }
        setAssigning(orderId)
        const res = await dispatch(assignOrder(orderId, selected[orderId]))
        setAssigning(null)
        if (res && !res.success) {
            toast(res.error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER })
        }
    }

    const assignable = adminOrders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled')

    return (
        <div className="ad-assign">
            <div className="ad-page-head">
                <div>
                    <h1>Assign Delivery Boy</h1>
                    <p>Map active orders to your delivery partners — only available partners are selectable</p>
                </div>
            </div>
            {orderLoading || dbLoading ? <Loader /> : (
                assignable.length === 0 ? (
                    <div className="ad-empty">
                        <i className="fa fa-inbox" aria-hidden="true"></i>
                        <p>No active orders to assign.</p>
                    </div>
                ) : (
                    <div className="ad-assign__list">
                        {assignable.map(order => {
                            const current = order.deliveryBoy
                                ? deliveryBoys.find(b => String(b._id) === String(order.deliveryBoy))
                                : null;
                            return (
                                <div className="ad-card" key={order._id}>
                                    <div className="ad-card__body">
                                        <div className="ad-assign__head">
                                            <div>
                                                <span className="ad-badge ad-badge--accent">#{order._id.slice(-8).toUpperCase()}</span>
                                                <span className="ad-muted" style={{ marginLeft: '0.6rem' }}>
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                            <span className={`ad-badge ${statusBadge(order.orderStatus)}`}>{order.orderStatus}</span>
                                        </div>
                                        <div className="ad-assign__meta">
                                            <span><i className="fa fa-map-marker" aria-hidden="true"></i> {order.shippingInfo?.city || ''} · {order.shippingInfo?.state || ''} · {order.shippingInfo?.postalCode || ''}</span>
                                            <span><i className="fa fa-shopping-bag" aria-hidden="true"></i> {order.orderItems?.length || 0} item(s) · {toINR(order.totalPrice || 0)}</span>
                                            <span><i className="fa fa-phone" aria-hidden="true"></i> {order.shippingInfo?.phoneNo || '—'}</span>
                                        </div>
                                        <div className="ad-assign__foot">
                                            {current && (
                                                <span className="ad-badge ad-badge--success">
                                                    <i className="fa fa-motorcycle" aria-hidden="true"></i> {current.name}
                                                </span>
                                            )}
                                            <div className="ad-assign__row">
                                                <select
                                                    className="ad-select"
                                                    style={{ minWidth: 220 }}
                                                    value={selected[order._id] || ''}
                                                    onChange={e => setSelected(s => ({ ...s, [order._id]: e.target.value }))}
                                                >
                                                    <option value="">{current ? 'Reassign…' : 'Select delivery boy…'}</option>
                                                    {deliveryBoys.map(b => (
                                                        <option key={b._id} value={b._id} disabled={b.availability === false}>
                                                            {b.name} ({b.email}){b.availability === false ? ' — Unavailable' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="ad-btn ad-btn--primary"
                                                    disabled={assigning === order._id || !selected[order._id]}
                                                    onClick={() => handleAssign(order._id)}
                                                >
                                                    {assigning === order._id ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-motorcycle" aria-hidden="true"></i>}
                                                    Assign
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    )
}
