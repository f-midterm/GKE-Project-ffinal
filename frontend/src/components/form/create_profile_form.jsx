import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';
import { createProfile, formatPhoneNumber, validatePhoneNumber } from '../../api/services/profile.service';

function CreateProfileForm() {

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        emergencyContact: '',
        emergencyPhone: '',
        occupation: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        
        // Auto-format phone numbers as user types
        if (name === 'phone' || name === 'emergencyPhone') {
            const formatted = formatPhoneInput(value);
            setFormData(prev => ({
                ...prev,
                [name]: formatted,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
        
        // Clear error when user starts typing
        if (error) setError('');
    }, [error]);

    // Format phone input in real-time as user types
    const formatPhoneInput = (value) => {
        // Remove all non-numeric characters
        const cleaned = value.replace(/\D/g, '');
        
        // Limit to 10 digits
        const limited = cleaned.substring(0, 10);
        
        // Format as XXX-XXX-XXXX
        if (limited.length <= 3) {
            return limited;
        } else if (limited.length <= 6) {
            return `${limited.slice(0, 3)}-${limited.slice(3)}`;
        } else {
            return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login first to create a profile');
            setTimeout(() => navigate('/login'), 2000);
            return;
        }
        
        // Validate phone numbers
        if (!validatePhoneNumber(formData.phone)) {
            setError('Phone number must be 10 digits');
            return;
        }
        
        if (!validatePhoneNumber(formData.emergencyPhone)) {
            setError('Emergency phone number must be 10 digits');
            return;
        }

        // Validate required fields
        if (!formData.firstName || !formData.lastName || !formData.emergencyContact) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            // Format phone numbers before sending
            const profileData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formatPhoneNumber(formData.phone),
                emergencyContact: formData.emergencyContact.trim(),
                emergencyPhone: formatPhoneNumber(formData.emergencyPhone),
                occupation: formData.occupation.trim() || null
            };

            console.log('Sending profile data:', profileData);
            console.log('Token present:', !!token);

            const response = await createProfile(profileData);
            console.log('Profile created successfully:', response);
            
            // Redirect to booking page
            navigate('/booking');
        } catch (err) {
            console.error('Error creating profile:', err);
            if (err.message.includes('401')) {
                setError('Session expired. Please login again.');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(err.message || 'Failed to create profile. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col justify-center items-center w-[500px]'>

            {/* Header */}
            <h1 className='lg:text-5xl sm:text-3xl text-3xl font-medium lg:mb-6 mb-4 sm:mb-4 bg-gradient-to-r from-[#0076D4] to-[#303841] bg-clip-text text-transparent '>
                Create Your Profile
            </h1>
            <p className='lg:text-xl sm:text-md mb-6 lg:mb-8 sm:mb-6'>Please, Enter Your Information below.</p>
            
            {/* Error Message */}
            {error && (
                <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
                    {error}
                </div>
            )}
            
            {/* Input Section */}
            <form onSubmit={handleSubmit} className='space-y-4 lg:space-y-6 sm:space-y-4 w-full'>
                {/* Firstname */}
                <div>
                    <label htmlFor="firstName" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text"
                        id='firstName'
                        name='firstName'
                        value={formData.firstName}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="John"
                        required
                    />
                </div>
                
                {/* Lastname */}
                <div>
                    <label htmlFor="lastName" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text"
                        id='lastName'
                        name='lastName'
                        value={formData.lastName}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="Doe"
                        required
                    />
                </div>

                {/* Phone number */}
                <div>
                    <label htmlFor="phone" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text"
                        id='phone'
                        name='phone'
                        value={formData.phone}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="123-456-7890"
                        required
                        maxLength="12"
                    />
                    <p className="text-xs text-gray-500 mt-1">10 digits (auto-formats as you type)</p>
                </div>

                {/* Occupation */}
                <div>
                    <label htmlFor="occupation" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Occupation <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input 
                        type="text"
                        id='occupation'
                        name='occupation'
                        value={formData.occupation}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="Engineer, Teacher, etc."
                    />
                </div>

                {/* Emergency Contact Name */}
                <div>
                    <label htmlFor="emergencyContact" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Emergency Contact Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text"
                        id='emergencyContact'
                        name='emergencyContact'
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="Jane Doe"
                        required
                    />
                </div>

                {/* Emergency Phone number */}
                <div>
                    <label htmlFor="emergencyPhone" className='block lg:text-xl sm:text-md text-md lg:mb-3 mb-2'>
                        Emergency Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text"
                        id='emergencyPhone'
                        name='emergencyPhone'
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        className='w-full px-3 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
                        placeholder="098-765-4321"
                        required
                        maxLength="12"
                    />
                    <p className="text-xs text-gray-500 mt-1">10 digits (auto-formats as you type)</p>
                </div>
                
                {/* Submit button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 sm:py-3 lg:py-4 text-white border-none rounded-2xl bg-gradient-to-r from-gray-700 via-blue-500 to-blue-300 text-md sm:text-lg lg:text-xl cursor-pointer shadow-md hover:translate-y-[-2px] duration-200"
                >
                    {loading ? 'Creating...' : 'Create Profile'}
                </button>
            </form>
        </div>
    )
}

export default CreateProfileForm