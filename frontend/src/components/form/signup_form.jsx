import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { register } from '../../api';

function SignupForm() {

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const toggleConfirmPassword = useCallback(() => {
        setShowConfirmPassword(prev => !prev);
    }, []);

    const { password, confirmPassword } = formData;
    const passwordsMatch = useMemo(() => password === confirmPassword, [password, confirmPassword]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            await register({
                username: formData.username,
                password: formData.password,
                email: formData.email
            });
        
            // After successful registration, redirect to login
            navigate('/create-profile', { 
                state: { 
                    message: 'Registration successful! Please create your profile.' 
                }
            });

        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [formData, navigate]);

    return (
        <div className='flex flex-col justify-center items-cente w-[500px]'>

            {/* Header */}
            <h1 className='lg:text-5xl sm:text-3xl text-3xl font-medium lg:mb-6 mb-4 sm:mb-4 bg-gradient-to-r from-[#0076D4] to-[#303841] bg-clip-text text-transparent '>
                Get started with us
            </h1>
            <p className='lg:text-xl sm:text-md mb-6 lg:mb-8 sm:mb-6'>Create a new account to get started with <span className='text-[#0076D4]'>BeLiv</span>.</p>

            {/* Input Section */}
            <form className='space-y-4 lg:space-y-6 sm:space-y-4 w-full' onSubmit={handleSubmit}>

                {/* Username */}
                <div>
                    <label htmlFor="username" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Username
                    </label>
                    <input 
                        type="text"
                        id='username'
                        name='username'
                        value={formData.username}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="Enter Username"
                        required
                    />
                </div>
                
                {/* Email */}
                <div>
                    <label htmlFor="email" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Email
                    </label>
                    <input 
                        type="email"
                        id='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="who@company.com"
                        required
                    />
                </div>

                {/* Enter Password */}
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
                        placeholder='Enter your Password'
                        required
                    />
                    <button
                        type="button"
                        onClick={togglePassword}
                        className="absolute lg:inset-y-16  inset-y-14 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <VscEyeClosed size={20} /> : <VscEye size={20} />}
                    </button>
                </div>

                {/* Confirm Password */}
                <div className='relative'>
                    <label htmlFor="confirmPassword" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Confirm Password
                    </label>
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id='confirmPassword'
                        name='confirmPassword'
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-3 py-3 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${confirmPassword && !passwordsMatch ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder='Confirm your Password'
                        required
                    />
                    <button
                        type="button"
                        onClick={toggleConfirmPassword}
                        className="absolute lg:inset-y-16  inset-y-14 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                        {showConfirmPassword ? <VscEyeClosed size={20} /> : <VscEye size={20} />}
                    </button>
                </div>
                
                {error && (
                    <div className="p-2 text-sm text-center text-red-800 ">
                        {error}
                    </div>
                )}

                {/* Remember and Forget Password */}
                {/* <div className="flex flex-col sm:flex-row sm:justify-.jsxbetween gap-3 sm:gap-0">
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
                    className={`w-full py-2 sm:py-3 lg:py-4 text-white border-none rounded-2xl bg-gradient-to-r from-gray-700 via-blue-500 to-blue-300 text-md sm:text-lg lg:text-xl shadow-md duration-200 cursor-pointer hover:translate-y-[-2px]`}                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                
                <div className='form-divider'><span>OR</span></div>
                <p className="flex lg:text-lg sm:text-md text-md justify-center">
                    Already Have An Account? <Link to="/login" className="text-[#0076D4] hover:underline px-1">Sign In</Link>
                </p>
            </form>
        </div>
    )
}

export default SignupForm