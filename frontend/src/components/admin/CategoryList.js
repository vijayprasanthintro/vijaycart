import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../actions/categoryActions';
import { clearCategoryState } from '../../actions/categoryActions';
import { toast } from 'react-toastify';

export default function CategoryList() {
    const { categories = [], loading, error, isCreated, isUpdated, isDeleted } = useSelector(state => state.categoryState);
    const dispatch = useDispatch();

    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('fa-tag');
    const [sortOrder, setSortOrder] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(getCategories());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearCategoryState);
            return;
        }
        if (isCreated) {
            toast('Category created', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearCategoryState);
            setModal(false);
        }
        if (isUpdated) {
            toast('Category updated', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearCategoryState);
            setModal(false);
        }
        if (isDeleted) {
            toast('Category deleted', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearCategoryState);
        }
    }, [dispatch, error, isCreated, isUpdated, isDeleted]);

    const openCreate = () => {
        setEditing(null);
        setName('');
        setIcon('fa-tag');
        setSortOrder(categories.length + 1);
        setModal(true);
    };

    const openEdit = (cat) => {
        setEditing(cat);
        setName(cat.name);
        setIcon(cat.icon || 'fa-tag');
        setSortOrder(cat.sortOrder || 0);
        setModal(true);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast('Please enter a category name', { type: 'warning' });
            return;
        }
        setSaving(true);
        if (editing) {
            await dispatch(updateCategory(editing._id, { name, icon, sortOrder: Number(sortOrder) }));
        } else {
            await dispatch(createCategory({ name, icon, sortOrder: Number(sortOrder) }));
        }
        setSaving(false);
    };

    const toggleActive = (cat) => {
        dispatch(updateCategory(cat._id, { active: !cat.active }));
    };

    const remove = (cat) => {
        if (window.confirm(`Delete category "${cat.name}"?`)) {
            dispatch(deleteCategory(cat._id));
        }
    };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Categories</h1>
                    <p>Organize your catalogue · {categories.length} categories</p>
                </div>
                <button type="button" className="ad-btn ad-btn--primary" onClick={openCreate}><i className="fa fa-plus" aria-hidden="true"></i> New Category</button>
            </div>

            <div className="ad-card">
                <div className="ad-card__body ad-card__body--flush">
                    {loading && categories.length === 0 ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading categories…</div>
                    ) : categories.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-th-large" aria-hidden="true"></i><p>No categories yet. Create your first one.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Icon</th>
                                        <th>Name</th>
                                        <th>Sort Order</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(cat => (
                                        <tr key={cat._id}>
                                            <td><span className="ad-avatar"><i className={`fa ${cat.icon || 'fa-tag'}`} aria-hidden="true"></i></span></td>
                                            <td><span className="ad-td-strong">{cat.name}</span></td>
                                            <td><span className="ad-td-mono">{cat.sortOrder || 0}</span></td>
                                            <td>
                                                <label className="ad-toggle-row" style={{ padding: 0, border: 'none' }}>
                                                    <div className="ad-toggle">
                                                        <input type="checkbox" checked={cat.active} onChange={() => toggleActive(cat)} />
                                                        <span className="ad-toggle__slider"></span>
                                                    </div>
                                                </label>
                                            </td>
                                            <td>
                                                <div className="ad-toolbar">
                                                    <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => openEdit(cat)}><i className="fa fa-pencil" aria-hidden="true"></i></button>
                                                    <button type="button" className="ad-btn ad-btn--danger ad-btn--sm ad-btn--icon" onClick={() => remove(cat)}><i className="fa fa-trash" aria-hidden="true"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {modal && (
                <div className="ad-modal-overlay" onClick={() => setModal(false)}>
                    <div className="ad-modal" onClick={e => e.stopPropagation()}>
                        <div className="ad-modal__head">
                            <h3>{editing ? 'Edit Category' : 'New Category'}</h3>
                            <button type="button" className="ad-modal__close" onClick={() => setModal(false)}><i className="fa fa-times" aria-hidden="true"></i></button>
                        </div>
                        <form className="ad-form" onSubmit={submit}>
                            <div className="ad-field">
                                <label className="ad-label">Category Name</label>
                                <input className="ad-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Electronics" autoFocus />
                            </div>
                            <div className="ad-form--grid">
                                <div className="ad-field">
                                    <label className="ad-label">Icon (Font Awesome)</label>
                                    <input className="ad-input" value={icon} onChange={e => setIcon(e.target.value)} placeholder="fa-tag" />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Sort Order</label>
                                    <input className="ad-input" type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
                                </div>
                            </div>
                            <div className="ad-modal__actions">
                                <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="ad-btn ad-btn--primary" disabled={saving}>
                                    {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>}
                                    {editing ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Fragment>
    );
}
