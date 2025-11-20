import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../api";

const navLinks = [
  { name: "Dashboard", path: "/admin" },
  { name: "Tenants", path: "/admin/tenants" },
  { name: "Payments", path: "/admin/payments" },
  { name: "Maintenance", path: "/admin/maintenance" },
  { name: "Report", path: "/admin/report" },
  { name: "Stock", path: "/admin/stock" },
  { name: "Log", path: "/admin/log" },
];

const settingsLinks = [
  { name: "Notfications", path: "/admin/notifications" },
  { name: "Terms & Policy", path: "/admin/terms" },
];

function AdminSidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavLink = ({ children, to, active }) => (
    <Link
      to={to}
      className={`block py-2.5 px-4 rounded-md transition-colors duration-200 no-underline ${
        active
          ? "bg-[#0076D4] text-white"
          : "hover:bg-[#0076D4] hover:text-white text-black"
      }`}
      onClick={() => setIsOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <>
      {/* Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-50 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "transform-none" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <h1 className="text-4xl font-semibold logo">BeLiv</h1>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-grow p-6 space-y-2">
          {navLinks.map((link) => {
            // treat exact /admin as exact match, otherwise match startsWith for nested routes
            const isActive =
              link.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(link.path);

            return (
              <NavLink key={link.name} to={link.path} active={isActive}>
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-700">
          {settingsLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              active={location.pathname.startsWith(link.path)}
            >
              {link.name}
            </NavLink>
          ))}

          <button
            onClick={handleLogout}
            className="w-full mt-4 py-2.5 px-4 rounded-md text-center text-gray-300 bg-gray-700 border-none cursor-pointer transition-colors duration-200 hover:bg-red-700 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
