import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ProfilePageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center">
              <Skeleton circle={true} height={128} width={128} />
              <div className="mt-4 text-center">
                <Skeleton width={150} height={24} />
                <Skeleton width={100} height={20} className="mt-2" />
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">
              <Skeleton width={200} />
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton height={20} />
                <Skeleton height={20} className="mt-2" />
              </div>
              <div>
                <Skeleton height={20} />
                <Skeleton height={20} className="mt-2" />
              </div>
              <div>
                <Skeleton height={20} />
                <Skeleton height={20} className="mt-2" />
              </div>
              <div>
                <Skeleton height={20} />
                <Skeleton height={20} className="mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;