import React from 'react'
import { Link } from 'react-router-dom'
import SignupForm from '../../components/form/signup_form'

function SignupPage() {
  return (
    <div className='flex flex-col lg:flex-row min-h-screen bg-gray-50'>
        
        {/* Left Panel */}
        <div 
            className="hidden lg:flex lg:w-1/2 text-white flex-col p-6 lg:p-12 bg-cover bg-center"
            style={{
                backgroundImage: `linear-gradient(180deg, rgba(217, 217, 217, 0.85), rgba(3, 88, 156, 0.85)), url('https://5.imimg.com/data5/SELLER/Default/2022/7/IK/IL/NS/153296493/apartment-buildings-construction.jpg')`
            }}
        >
            <Link 
                to="/"
                className="text-3xl lg:text-5xl font-medium logo w-fit z-50"
            >
                BeLiv
            </Link>
        </div>
        
        {/* Right Panel */}
        <div className="lg:w-1/2 flex items-center justify-center lg:p-16 sm:p-6 p-6  sm:py-20 py-24">
           <SignupForm />
        </div>
    </div>
  )
}

export default SignupPage