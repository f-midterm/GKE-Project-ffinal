import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const RentalRequestsPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton height={40} width={300} />
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <Skeleton height={24} width="80%" />
                <Skeleton height={20} width="60%" className="mt-2" />
              </div>
              <div>
                <Skeleton height={20} width="90%" />
              </div>
              <div>
                <Skeleton height={20} width="70%" />
              </div>
              <div className="flex justify-end space-x-2">
                <Skeleton height={36} width={80} />
                <Skeleton height={36} width={80} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentalRequestsPageSkeleton;