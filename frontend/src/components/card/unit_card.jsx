import React from 'react';
import { useNavigate } from 'react-router-dom';

function UnitCard({ unit }) {
  const navigate = useNavigate();
  const isOccupied = unit.status === 'OCCUPIED';
  const statusClass = isOccupied ? 'occupied' : 'vacant';
  const bgColor = isOccupied ? 'bg-red-100' : 'bg-green-100';
  const textColor = isOccupied ? 'text-red-800' : 'text-green-800';
  const statusColor = isOccupied ? 'text-red-600' : 'text-green-600';

  const handleNavigate = () => {
    navigate(`/admin/unit/${unit.id}`);
  };

  return (
    <div 
      onClick={handleNavigate} 
      className={`flex flex-col justify-center items-center cursor-pointer shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-shadow p-4 rounded-xl ${bgColor}`}>
      <p className={`font-medium text-md ${textColor}`}>Si {unit.roomNumber}</p>
      <p className={`text-sm mt-1 ${statusColor}`}>{unit.status}</p>
    </div>
  );
}

export default UnitCard;