import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { login } from '../../api';

function LoginForm() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();    
    const [showPassword, setShowPassword] = useState(false)

    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    // Get the intended destination from location state
    const from = location.state?.from?.pathname || null;

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(formData.username, formData.password);
            
            // Role-based navigation
            if (response.role === 'ADMIN') {
                navigate('/admin');
            } 
            // else if (response.role === 'VILLAGER') {
            //     navigate('/villager-dashboard');
            // } 
            // else if (response.role === 'USER') {
            //     navigate('/waiting', { replace: true });
            // } 
            else {
                navigate('/');
            }

        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    }, [formData.username, formData.password, navigate]);

    return (
        <div className="flex flex-col justify-center items-center w-[500px]">
            {/* Header */}
            <h1 className='lg:text-5xl sm:text-3xl text-3xl font-medium lg:mb-6 mb-4 sm:mb-4 bg-gradient-to-r from-[#0076D4] to-[#303841] bg-clip-text text-transparent '>
                Welcome Back
            </h1>
            <p className='lg:text-xl sm:text-md mb-6 lg:mb-8 sm:mb-6'>Enter your email and password to access your account.</p>

            {/* Input Section */}
            
            <form className='space-y-4 lg:space-y-6 sm:space-y-4 w-full' onSubmit={handleSubmit}>

                {/* Username */}
                <div>
                    <label htmlFor="username" className="block lg:text-xl sm:text-md text-md lg:mb-3 mb-2">
                        Username
                    </label>
                    <input 
                        type="text"
                        id='username'
                        name='username'
                        value={formData.username}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="Enter Username or Email"
                        required
                    />
                </div>
                
                {/* Password */}
                <div className='relative'>
                    <label htmlFor="password" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Password
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id='password'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder='Enter Password'
                        required
                    />
                    <button
                        type="button"
                        onClick={togglePassword}
                        className="absolute lg:inset-y-16  inset-y-14 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? <VscEyeClosed size={20} /> : <VscEye size={20} />}
                    </button>
                </div>

                {error && (
                    <div className="p-2 text-sm text-center text-red-800">
                        {error}
                    </div>
                )}            
                    
                {/* Remember and Forget Password */}
                {/* <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
                    <label className="remember-me text-sm sm:text-sm lg:text-lg">
                        <input type="checkbox" className="mr-1" /> Remember me
                    </label>
                    <Link to="/forgot-password" className="text-sm sm:text-sm lg:text-lg font-medium text-blue-500 hover:underline">
                        Forgot Password?
                    </Link>
                </div> */}



                {/* Submit button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 sm:py-3 lg:py-4 text-white border-none rounded-2xl bg-gradient-to-r from-gray-700 via-blue-500 to-blue-300 text-md sm:text-lg lg:text-xl cursor-pointer shadow-md hover:translate-y-[-2px] duration-200"
                >
                    {loading ? 'Signing in...' : 'Login'}
                </button>

                <div className='form-divider'><span>OR</span></div>
                <p className="flex lg:text-lg sm:text-md text-md justify-center">
                    Don't Have An Account? Let's <Link to="/signup" className="text-[#0076D4] hover:underline px-1">Get Started</Link>
                </p>

                
            </form>
        </div>
    )
}

export default LoginForm