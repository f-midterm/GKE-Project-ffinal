import { useState } from 'react'
import { Outlet } from 'react-router-dom';
import UserNavbar from '../../components/navbar/user_navbar';
import UserSidebar from '../../components/sidebar/user_sidebar';

function UserLayout() {

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className='min-h-screen flex flex-col'>
            {/* Sidebar */}
            <UserSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Header Section */}
            <header>
                <UserNavbar toggleSidebar={toggleSidebar} />
            </header>

            {/* Main Section */}
            <main className='flex-1 w-full mx-auto lg:py-36 lg:px-32 py-36 px-12 sm:px-24 bg-[#F3F3F3]'>
                <Outlet />
            </main>
        </div>
    )
}

export default UserLayout