import React from 'react';

function UnitSelectedCard({ unit, isSelected, onSelect }) {
  // const { unitNumber, rent, floor } = unit;
  const { roomNumber, rentAmount, floor, type } = unit;

  const baseClasses = 'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200';
  const selectedClasses = isSelected
    ? 'border-gray-500 shadow-md'
    : 'border-gray-200 hover:border-gray-300 hover:shadow-md';

  return (
    <div 
      onClick={() => onSelect(unit.id)}
      className={`${baseClasses} ${selectedClasses}`}
    >
      <h3 className="text-lg font-medium text-gray-900">Si {roomNumber}</h3>
      <p className="text-sm text-gray-500">
        Rent: {rentAmount}฿ / Floor: {floor}
      </p>
      <p className="text-xs text-gray-400 mt-1">{type}</p>
    </div>                  
  );
}

export default UnitSelectedCard;