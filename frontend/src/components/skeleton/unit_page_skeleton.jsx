import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const UnitPageSkeleton = () => {
  return (
    <div>
      {/* Room Number */}
      <div className='flex flex-row justify-between items-center sm:items-center gap-4'>
        <div>
          <Skeleton height={40} width={200} />
          <Skeleton height={20} width={150} className="mt-2" />
        </div>
        {/* Action Button */}
        <div>
          <Skeleton height={40} width={100} />
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
        {/* Left Column */}
        <div className='lg:col-span-2 flex flex-col gap-6'>
          {/* Tenant infomation */}
          <Skeleton height={200} />

          {/* Electricity and Water bill graph */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Skeleton height={300} />
            <Skeleton height={300} />
          </div>

          {/* Maintenance Log Table */}
          <Skeleton height={200} />
        </div>

        {/* Right Column */}
        <div className='lg:col-span-1 flex flex-col gap-6'>
          <Skeleton height={150} />
          <Skeleton height={250} />
        </div>
      </div>
    </div>
  );
};

export default UnitPageSkeleton;