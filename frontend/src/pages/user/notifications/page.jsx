import React, { useState, useEffect } from 'react'
import NotificationsCard from '../../../components/card/notifications_card';
import { MdOutlineNotificationsPaused, MdDelete, MdInfo } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { getAllNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../../api/services/maintenanceNotification.service';
import { formatDateTime } from '../../../utils/dateUtils';

function UserNotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState([]);
    const [readNotifications, setReadNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await getAllNotifications();
            setNotifications(data);
            
            const unread = data.filter(n => !n.isRead);
            const read = data.filter(n => n.isRead);
            
            setUnreadNotifications(unread);
            setReadNotifications(read);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            alert('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
            fetchNotifications(); // Refresh list
        } catch (error) {
            console.error('Error marking notification as read:', error);
            alert('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            fetchNotifications(); // Refresh list
        } catch (error) {
            console.error('Error marking all as read:', error);
            alert('Failed to mark all as read');
        }
    };

    const handleDelete = async (notificationId) => {
        if (confirm('Are you sure you want to delete this notification?')) {
            try {
                await deleteNotification(notificationId);
                fetchNotifications(); // Refresh list
            } catch (error) {
                console.error('Error deleting notification:', error);
                alert('Failed to delete notification');
            }
        }
    };

    const handleViewDetail = async (notification) => {
        setSelectedNotification(notification);
        setShowDetailModal(true);
        
        // Mark as read if unread (without refetching)
        if (!notification.isRead) {
            try {
                await markAsRead(notification.id);
                
                // Update local state instead of refetching
                setNotifications(prev => 
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
                setUnreadNotifications(prev => prev.filter(n => n.id !== notification.id));
                setReadNotifications(prev => [...prev, { ...notification, isRead: true }]);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
    };

    const getNotificationTypeColor = (type) => {
        const colors = {
            'UPCOMING_MAINTENANCE': 'text-blue-600 bg-blue-50',
            'OVERDUE': 'text-red-600 bg-red-50',
            'STATUS_CHANGE': 'text-yellow-600 bg-yellow-50',
            'COMPLETED': 'text-green-600 bg-green-50',
            'SCHEDULE_REMINDER': 'text-purple-600 bg-purple-50',
            'ASSIGNED': 'text-cyan-600 bg-cyan-50',
            'GENERAL': 'text-gray-600 bg-gray-50'
        };
        return colors[type] || 'text-gray-600 bg-gray-50';
    };



    if (loading) {
        return (
            <div className='flex justify-center items-center min-h-[600px]'>
                <div className='text-xl text-gray-500'>Loading notifications...</div>
            </div>
        );
    }

    return (
        <div className=''>
            
            {/* Empty State */}
            {notifications.length === 0 && (
                <div className='flex flex-col justify-center items-center min-h-[600px]'>
                    <div className='bg-gray-200 p-8 rounded-full mb-6'>
                        <MdOutlineNotificationsPaused size={100} className='text-gray-400' />
                    </div>

                    <div className='text-4xl font-medium mb-4 text-gray-700'>
                        You're all caught up!
                    </div>

                    <div className='text-lg text-gray-400'>
                        Come back later for more notifications.
                    </div>
                </div>
            )}

            {/* Notification List */}
            {notifications.length > 0 && (
                <div className='flex flex-col'>
                    
                    {/* Unread Notifications */}
                    {unreadNotifications.length > 0 && (
                        <>
                            <div className='flex justify-between items-center mb-4'>
                                <div className='text-xl font-medium'>
                                    Unread ({unreadNotifications.length})
                                </div>
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition'
                                >
                                    Mark All as Read
                                </button>
                            </div>

                            <div className='border-b border-gray-400 mb-4'></div>

                            {unreadNotifications.map((notification) => (
                                <div key={notification.id} className='mb-4'>
                                    <div className='text-gray-400 text-sm mb-2'>
                                        {formatDateTime(notification.createdAt)}
                                    </div>
                                    <div className='flex gap-3 items-start bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg'>
                                        <div className='flex-1'>
                                            <div className='font-semibold text-gray-800 mb-1'>
                                                {notification.title}
                                            </div>
                                            <div className='text-sm text-gray-600 mb-2'>
                                                {notification.message}
                                            </div>
                                            <div className='flex gap-2'>
                                                <span className={`text-xs px-2 py-1 rounded ${getNotificationTypeColor(notification.notificationType)}`}>
                                                    {notification.notificationType.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={() => handleViewDetail(notification)}
                                                className='p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition'
                                                title='View Details'
                                            >
                                                <MdInfo size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition'
                                                title='Delete'
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    
                    {/* Read Notifications */}
                    {readNotifications.length > 0 && (
                        <>
                            <div className='text-xl font-medium mb-4 mt-8'>
                                Read ({readNotifications.length})
                            </div>

                            <div className='border-b border-gray-400 mb-4'></div>

                            {readNotifications.map((notification) => (
                                <div key={notification.id} className='mb-4'>
                                    <div className='text-gray-400 text-sm mb-2'>
                                        {formatDateTime(notification.createdAt)}
                                    </div>
                                    <div className='flex gap-3 items-start bg-gray-50 border-l-4 border-gray-300 p-4 rounded-lg opacity-70'>
                                        <div className='flex-1'>
                                            <div className='font-semibold text-gray-700 mb-1'>
                                                {notification.title}
                                            </div>
                                            <div className='text-sm text-gray-600 mb-2'>
                                                {notification.message}
                                            </div>
                                            <div className='flex gap-2'>
                                                <span className={`text-xs px-2 py-1 rounded ${getNotificationTypeColor(notification.notificationType)}`}>
                                                    {notification.notificationType.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={() => handleViewDetail(notification)}
                                                className='p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition'
                                                title='View Details'
                                            >
                                                <MdInfo size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition'
                                                title='Delete'
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedNotification && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' onClick={() => setShowDetailModal(false)}>
                    <div className='bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4' onClick={(e) => e.stopPropagation()}>
                        <div className='flex justify-between items-start mb-4'>
                            <div>
                                <h3 className='text-2xl font-semibold text-gray-800 mb-2'>
                                    {selectedNotification.title}
                                </h3>
                                <span className={`text-xs px-3 py-1 rounded ${getNotificationTypeColor(selectedNotification.notificationType)}`}>
                                    {selectedNotification.notificationType.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className='text-gray-400 hover:text-gray-600 text-2xl'
                            >
                                ×
                            </button>
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <label className='text-sm font-medium text-gray-700'>Message</label>
                                <div className='mt-1 text-gray-600 whitespace-pre-line'>{selectedNotification.message || 'No message'}</div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                {/* <div>
                                    <label className='text-sm font-medium text-gray-700'>Created At</label>
                                    <p className='mt-1 text-gray-600'>{formatDateTime(selectedNotification.createdAt)}</p>
                                </div> */}
                                {/* {selectedNotification.readAt && (
                                    // <div>
                                    //     <label className='text-sm font-medium text-gray-700'>Read At</label>
                                    //     <p className='mt-1 text-gray-600'>{formatDateTime(selectedNotification.readAt)}</p>
                                    // </div>
                                )} */}
                            </div>

                            {/* {selectedNotification.requestId && ( */}
                                {/* // <div>
                                //     <label className='text-sm font-medium text-gray-700'>Related Maintenance Request</label>
                                //     <p className='mt-1 text-gray-600'>Request ID: #{selectedNotification.requestId}</p> */}
                                     {/* <button
                                //         onClick={() => {
                                //             setShowDetailModal(false);
                                //             navigate('/user/maintenance');
                                //         }}
                                //         className='mt-2 text-blue-600 hover:underline text-sm'
                                //     >
                                //         View Maintenance Request →
                                //     </button> */}
                                </div>
                            {/* )} */}

                            {/* {selectedNotification.scheduleId && (
                                <div>
                                    <label className='text-sm font-medium text-gray-700'>Related Maintenance Schedule</label>
                                    <p className='mt-1 text-gray-600'>Schedule ID: #{selectedNotification.scheduleId}</p>
                                </div>
                            )}
                        </div> */}

                        <div className='mt-6 flex gap-2 justify-end'>
                            {!selectedNotification.isRead && (
                                <button
                                    onClick={() => {
                                        handleMarkAsRead(selectedNotification.id);
                                        setShowDetailModal(false);
                                    }}
                                    className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
                                >
                                    Mark as Read
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    handleDelete(selectedNotification.id);
                                    setShowDetailModal(false);
                                }}
                                className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600'
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default UserNotificationsPage