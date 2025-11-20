import React from 'react';
import { RiBillLine } from "react-icons/ri";
import { HiArrowLeft } from "react-icons/hi2";

const SendInvoiceSkeleton = () => {
    return (
        <div className='flex flex-col animate-pulse'>
            {/* Back Button */}
            <div className="flex items-center gap-2 text-gray-600 hover:text-blue-500 mb-6">
                <HiArrowLeft className="w-5 h-5" />
                <div className="h-5 bg-gray-300 rounded w-24"></div>
            </div>

            <div>
                <div className='h-8 bg-gray-300 rounded w-48 lg:mb-6 mb-4'></div>
            </div>
            
            <div className='bg-white rounded-xl mb-4 p-6 shadow-md text-xl font-medium flex gap-4 items-center'>
                <div className='bg-gray-200 p-4 rounded-full'><RiBillLine className="text-gray-400" /></div>
                <div className="h-6 bg-gray-300 rounded w-40"></div>
            </div>
            
            <div className='grid grid-cols-1 gap-6'>

                {/* Left Detail */}
                <div className='grid grid-cols-1 gap-6'>
                    <div className='bg-white p-6 rounded-xl shadow-md'>
                        <div className='h-6 bg-gray-300 rounded w-32 mb-4'></div>

                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <div className="h-5 bg-gray-300 rounded w-24"></div>
                                <div className="h-5 bg-gray-300 rounded w-32"></div>
                            </div>
                            <div className='flex items-center justify-between'>
                                <div className="h-5 bg-gray-300 rounded w-28"></div>
                                <div className="h-5 bg-gray-300 rounded w-24"></div>
                            </div>
                            <div className='flex items-center justify-between'>
                                <div className="h-5 bg-gray-300 rounded w-20"></div>
                                <div className="h-5 bg-gray-300 rounded w-24"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className='bg-white p-6 rounded-xl shadow-md'>
                        <div className='h-6 bg-gray-300 rounded w-36 mb-4'></div>

                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <div className="h-5 bg-gray-300 rounded w-28"></div>
                                <div className="h-5 bg-gray-300 rounded w-20"></div>
                            </div>
                            
                            <div className='border-t pt-4'>
                                <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                                <div className="h-10 bg-gray-300 rounded w-full"></div>
                                <div className='flex items-center justify-between mt-2 text-sm'>
                                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                                    <div className="h-5 bg-gray-300 rounded w-16"></div>
                                </div>
                            </div>

                            <div className='border-t pt-4'>
                                <div className="h-4 bg-gray-300 rounded w-40 mb-2"></div>
                                <div className="h-10 bg-gray-300 rounded w-full"></div>
                                <div className='flex items-center justify-between mt-2 text-sm'>
                                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                                    <div className="h-5 bg-gray-300 rounded w-16"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                

                {/* Right Detail */}
                <div className='bg-white p-6 rounded-xl shadow-md'>
                    <div className='h-6 bg-gray-300 rounded w-24 mb-4'></div>

                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <div className="h-5 bg-gray-300 rounded w-16"></div>
                            <div className="h-5 bg-gray-300 rounded w-40"></div>
                        </div>
                        <div className='flex items-center justify-between'>
                            <div className="h-5 bg-gray-300 rounded w-12"></div>
                            <div className="h-5 bg-gray-300 rounded w-48"></div>
                        </div>
                        <div className='flex items-center justify-between'>
                            <div className="h-5 bg-gray-300 rounded w-14"></div>
                            <div className="h-5 bg-gray-300 rounded w-32"></div>
                        </div>
                    </div>
                    
                    <div className='border-b border-gray-200 my-6'></div>

                    <div>
                        <div className='flex items-center justify-between text-lg'>
                            <div className="h-6 bg-gray-300 rounded w-32"></div>
                            <div className="h-7 bg-gray-300 rounded w-24"></div>
                        </div>
                    </div>

                    <div className='border-b border-gray-200 my-6'></div>

                    {/* Action Button */}
                    <div className='flex lg:mt-12 mt-6 justify-end gap-4 '>
                        <div className='h-10 bg-gray-300 rounded w-24'></div>
                        <div className='h-10 bg-gray-300 rounded w-36'></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendInvoiceSkeleton;