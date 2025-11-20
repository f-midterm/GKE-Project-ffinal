import React, { useState, useEffect } from 'react'
import { getAllRentalRequests } from '../../../api/services/rentalRequests.service'
import { HiOutlineInbox } from 'react-icons/hi2'
import RentalRequestCard from '../../../components/card/rental_request_card'

import RentalRequestsPageSkeleton from '../../../components/skeleton/rental_requests_page_skeleton';

function RentalRequestsPage() {

    const [rentalRequests, setRentalRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sortBy, setSortBy] = useState('newest')
    const [filterBy, setFilterBy] = useState('all')

    useEffect(() => {
        fetchRentalRequests()
    }, [])

    const fetchRentalRequests = async() => {
        setLoading(true)
        
        try {
            const data = await getAllRentalRequests()
            setRentalRequests(data)
        } catch(err) {
            console.error('Failed to fetch rental requests:', err)
            setError('Failed to load rental requests. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const pendingCount = rentalRequests.filter(r => r.status === 'PENDING').length

    // Filter requests based on selected filter
    const filteredRequests = rentalRequests.filter(request => {
        if (filterBy === 'all') return true
        return request.status === filterBy
    })

    // Sort requests
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.requestDate) - new Date(a.requestDate)
        } else if (sortBy === 'oldest') {
            return new Date(a.requestDate) - new Date(b.requestDate)
        }
        return 0
    })

    return (
        <div>
            {/* Header */}
            <div className='title'>Rental Requests</div>

            {/* Sort Action */}
            <div className='flex mb-6 gap-8'>
                <div className='flex-grow font-medium text-gray-700 mt-6'>
                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className='bg-white border rounded-lg px-4 py-2 mr-2 text-sm text-gray-700 hover:bg-gray-50 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        <option value="newest">Sort by: Newest</option>
                        <option value="oldest">Sort by: Oldest</option>
                    </select>

                    {/* Filter */}
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className='bg-white border rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        <option value="all">Filter by: All</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>              
                </div>
            </div>

            {/* Loading State */}

            {pendingCount > 0 && (
                <p className='text-sm text-gray-600 mt-2'>
                        {pendingCount} pending request{pendingCount > 1 ? 's' : ''} awaiting review
                </p>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                </div>
            )}

            {/* Loading Content*/}
            {loading ? (
                <RentalRequestsPageSkeleton />
            ) : sortedRequests.length === 0 ? (
                /* Empty State */
                <div className="p-16 flex flex-col items-center justify-center text-center">
                    <div className="p-12 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                        <HiOutlineInbox className="h-16 w-16 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {filterBy === 'all' ? 'No Rental Requests' : `No ${filterBy} Requests`}
                    </h2>
                    <p className="text-gray-500">
                        {filterBy === 'all'
                            ? "You're all caught up! New requests will appear here."
                            : `No requests with status "${filterBy}".`
                        }
                    </p>
                </div>
            ) : (
                /* Request Cards */
                <div className='space-y-4 mt-6'>
                    {sortedRequests.map(request => (
                        <RentalRequestCard
                            key={request.id}
                            request={request}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default RentalRequestsPage
