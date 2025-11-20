import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const BookingPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="mb-8">
            <Skeleton height={40} width={200} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-lg shadow-md p-4">
                <Skeleton height={150} />
                <div className="mt-4">
                  <Skeleton height={24} width="80%" />
                  <Skeleton height={20} width="60%" className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="sticky top-8">
            <Skeleton height={300} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPageSkeleton;