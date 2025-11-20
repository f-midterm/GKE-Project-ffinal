import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AdminDashboardSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <Skeleton height={150} />
        <Skeleton height={150} />
        <Skeleton height={150} />
        <Skeleton height={150} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Skeleton height={300} />
        </div>
        <div>
          <Skeleton height={300} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSkeleton;