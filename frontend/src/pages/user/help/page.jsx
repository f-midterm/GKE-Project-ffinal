import React from 'react'
import { FcAbout } from "react-icons/fc";

function HelpPage() {
  return (
    <div className='flex justify-center items-center min-h-[640px]'>
        <form className='bg-white rounded-xl shadow-md p-8'>
            <div className='flex flex-col jutify-center items-center lg:min-w-[800px]'>
                {/* Header */}
                <div className='bg-blue-200 text-blue-700 rounded-full p-8 mb-4'>
                    <FcAbout size={36} />
                </div>

                <div className='text-2xl font-medium mb-2'>
                    Feedback & Suggestions
                </div>
                <div className='text-gray-400 mb-6 text-center'>Share your feedback and suggestion to improve web app</div>

                <div className='space-y-4 flex flex-col min-w-[400px] mb-6'>
                    <label>
                        <input 
                            type="text"
                            placeholder='Title'
                            className='border-2 px-4 py-2 border-gray-400 w-full rounded-lg focus:outline-none focus:border-blue-500'
                        />
                    </label>

                    <label>
                        <textarea 
                            type="text"
                            placeholder='Your thought'
                            className='border-2 px-4 py-2 border-gray-400 w-full rounded-lg focus:outline-none focus:border-blue-500 min-h-[100px]  '
                        />
                    </label>
                </div>

                <div className='flex justify-center items-center min-w-[200px]'>
                    <button
                        type="submit"
                        className='w-full py-2 sm:py-3 lg:py-4 text-white border-none rounded-full bg-gradient-to-r from-gray-700 via-blue-500 to-blue-300 text-md sm:text-lg lg:text-xl cursor-pointer shadow-md hover:translate-y-[-2px] duration-200'
                    >
                        Submit
                    </button>
                </div>
            </div>
        </form>
    </div>
  )
}

export default HelpPage