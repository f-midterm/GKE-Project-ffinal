import React, { useState, useEffect } from 'react'
import { MdOutlineNotificationsPaused } from "react-icons/md";
import NotificationsCard from '../../../components/card/notifications_card';
import { useNavigate } from 'react-router-dom';
import { getAllNotifications, markAsRead, markAllAsRead } from '../../../api/services/maintenanceNotification.service';

function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState([]);
    const [readNotifications, setReadNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
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
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            alert('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
            alert('Failed to mark all as read');
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                                <div key={notification.id} className='mb-6'>
                                    <div className='text-gray-400 mb-2'>
                                        {formatDateTime(notification.createdAt)}
                                    </div>
                                    <div className='flex gap-6 items-center'>
                                        <div className='w-full'>
                                            <div 
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className='cursor-pointer'
                                            >
                                                <NotificationsCard 
                                                    title={notification.title}
                                                    message={notification.message}
                                                    type={notification.notificationType}
                                                    isRead={notification.isRead}
                                                />
                                            </div>
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
                                <div key={notification.id} className='mb-6'>
                                    <div className='text-gray-400 mb-2'>
                                        {formatDateTime(notification.createdAt)}
                                    </div>
                                    <div className='flex gap-6 items-center'>
                                        <div className='w-full'>
                                            <NotificationsCard 
                                                title={notification.title}
                                                message={notification.message}
                                                type={notification.notificationType}
                                                isRead={notification.isRead}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default AdminNotificationsPage