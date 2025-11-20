import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const UserMaintenanceSkelleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Skeleton height={400} />
        </div>
        <div>
          <Skeleton height={40} className="mb-4" />
          <Skeleton height={80} className="mb-4" />
          <Skeleton height={200} className="mb-4" />
          <div className="flex justify-end gap-4">
            <Skeleton height={40} width={100} />
            <Skeleton height={40} width={100} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMaintenanceSkelleton;
