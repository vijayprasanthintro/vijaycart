import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from "react-router-dom";
import { getUser, updateUser } from "../../actions/userActions";
import { clearError, clearUserUpdated } from "../../slices/userSlice";
import { toast } from "react-toastify";

export default function UpdateUser() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [role, setRole] = useState("");

    const { id: userId } = useParams();
    const { loading, isUserUpdated, error, user } = useSelector(state => state.userState);
    const { user: authUser } = useSelector(state => state.authState);
    const dispatch = useDispatch();

    const submitHandler = (e) => {
        e.preventDefault();
        const formData = { name, email, mobile, role };
        dispatch(updateUser(userId, formData));
    }

    useEffect(() => {
        if (isUserUpdated) {
            toast('User updated successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearUserUpdated()) });
            return;
        }
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearError()) });
            return;
        }
        dispatch(getUser(userId));
    }, [isUserUpdated, error, dispatch, userId]);

    useEffect(() => {
        if (user._id) {
            setName(user.name);
            setEmail(user.email);
            setMobile(user.mobile || '');
            setRole(user.role);
        }
    }, [user]);

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Update User</h1>
                    <p>Account &amp; role management</p>
                </div>
            </div>

            <div className="ad-card" style={{ maxWidth: 520 }}>
                <div className="ad-card__body">
                    <form className="ad-form" onSubmit={submitHandler}>
                        <div className="ad-field">
                            <label className="ad-label">Name</label>
                            <input className="ad-input" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="ad-field">
                            <label className="ad-label">Email</label>
                            <input className="ad-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="ad-field">
                            <label className="ad-label">Mobile Number</label>
                            <input className="ad-input" type="tel" maxLength="10" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} />
                        </div>
                        <div className="ad-field">
                            <label className="ad-label">Role</label>
                            <select className="ad-select" disabled={user._id === authUser._id} value={role} onChange={e => setRole(e.target.value)}>
                                <option value="admin">Admin</option>
                                <option value="deliveryboy">Delivery Boy</option>
                                <option value="user">User</option>
                            </select>
                            {user._id === authUser._id && <span className="ad-help">You cannot change your own role.</span>}
                        </div>
                        <div className="ad-modal__actions" style={{ marginTop: 0 }}>
                            <button type="submit" className="ad-btn ad-btn--primary" disabled={loading}>
                                {loading && <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>} Update User
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Fragment>
    );
}
