import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminNavbar from '../../components/navbar/admin_navbar'
import AdminSidebar from '../../components/sidebar/admin_sidebar';

function AdminLayout() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className='min-h-screen flex flex-col'>
        {/* Sidebar */}
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        {/* Navbar */}
        <header>
            <AdminNavbar toggleSidebar={toggleSidebar} />
        </header>

        {/* Main Section */}
        <main className='flex-1 w-full mx-auto lg:py-36 lg:px-32 py-36 px-12 sm:px-24 bg-[#F3F3F3]'>
            <Outlet />
        </main>
    </div>
  )
}

export default AdminLayout