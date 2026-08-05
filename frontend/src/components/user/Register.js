import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearAuthError, register } from '../../actions/userActions'
import MetaData from '../layouts/MetaData'
import { toast } from 'react-toastify'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [errors, setErrors] = useState({})
    const [avatar, setAvatar] = useState("")
    const [avatarPreview, setAvatarPreview] = useState("./images/default_avatar.png")
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector(state => state.authState)

    const onChange = (e) => {
        if (e.target.name === 'avatar') {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setAvatarPreview(reader.result)
                    setAvatar(e.target.files[0])
                }
            }
            reader.readAsDataURL(e.target.files[0])
        } else {
            setUserData({ ...userData, [e.target.name]: e.target.value })
        }
    }

    const validate = () => {
        const errs = {};
        if (!userData.name.trim()) errs.name = 'Full name is required';
        else if (userData.name.trim().length < 3) errs.name = 'Name must be at least 3 characters';
        if (!userData.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email.trim())) errs.email = 'Enter a valid email address';
        if (!userData.password) errs.password = 'Password is required';
        else if (userData.password.length < 6) errs.password = 'Password must be at least 6 characters';
        if (!userData.confirmPassword) errs.confirmPassword = 'Please confirm your password';
        else if (userData.confirmPassword !== userData.password) errs.confirmPassword = 'Passwords do not match';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submitHandler = (e) => {
        e.preventDefault();
        if (!validate()) return;
        const formData = new FormData();
        formData.append('name', userData.name)
        formData.append('email', userData.email)
        formData.append('password', userData.password)
        formData.append('avatar', avatar)
        dispatch(register(formData))
    }

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/')
        }
        if (error) {
            toast(error, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
                onOpen: () => { dispatch(clearAuthError) }
            })
        }
    }, [error, isAuthenticated, dispatch, navigate])

    return (
        <Fragment>
            <MetaData title={`Register`} />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form onSubmit={submitHandler} className="shadow-lg" encType='multipart/form-data' noValidate>
                        <h1 className="mb-3">Create Account</h1>
                        <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Join VijayCart and start shopping smarter</p>

                        <div className="form-group">
                            <label htmlFor="name_field">Full Name</label>
                            <input type="text" id="name_field" className="form-control" name='name' value={userData.name} onChange={onChange} />
                            {errors.name && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.name}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email_field">Email</label>
                            <input type="email" id="email_field" className="form-control" name='email' value={userData.email} onChange={onChange} />
                            {errors.email && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.email}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password_field">Password</label>
                            <div className="password-wrap">
                                <input type={showPassword ? "text" : "password"} id="password_field" className="form-control" name='password' value={userData.password} onChange={onChange} />
                                <button type="button" className="show-password" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                                </button>
                            </div>
                            {errors.password && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.password}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm_field">Confirm Password</label>
                            <div className="password-wrap">
                                <input type={showConfirm ? "text" : "password"} id="confirm_field" className="form-control" name='confirmPassword' value={userData.confirmPassword} onChange={onChange} />
                                <button type="button" className="show-password" onClick={() => setShowConfirm(s => !s)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                                    <i className={`fa ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.confirmPassword}</p>}
                        </div>

                        <div className='form-group'>
                            <label htmlFor='avatar_upload'>Avatar</label>
                            <div className='d-flex align-items-center gap-3'>
                                <figure className='avatar' style={{ width: '60px', height: '60px' }}>
                                    <img src={avatarPreview} className='rounded-circle' alt='avatar' />
                                </figure>
                                <input type="file" onChange={onChange} name='avatar' id='file_input' className='form-control' style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '0.5rem' }} />
                            </div>
                        </div>

                        <button id="register_button" type="submit" className="btn btn-block py-3" disabled={loading}>
                            {loading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-user-plus mr-2" aria-hidden="true"></i>}
                            REGISTER
                        </button>

                        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.85rem' }}>Already have an account? <Link to="/login">Login</Link></p>
                    </form>
                </div>
            </div>
        </Fragment>
    )
}
