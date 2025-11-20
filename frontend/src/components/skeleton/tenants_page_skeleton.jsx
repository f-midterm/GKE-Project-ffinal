import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const TenantsPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton height={40} width={200} />
      </div>
      <div>
        <Skeleton height={400} />
      </div>
    </div>
  );
};

export default TenantsPageSkeleton;