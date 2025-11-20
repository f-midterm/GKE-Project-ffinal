import React, { useState, useEffect } from 'react';
import UnitSelectedCard from '../card/unit_selected_card';
import { getAvailableUnits } from '../../api/services/units.service';

function UnitList({ selectedUnitId, onSelectUnit }) {
  const [units, setUnits] = useState([]);
  const [error, setError] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const availableUnits = await getAvailableUnits();
        setUnits(availableUnits);
      } catch (err) {
        setError('Failed to fetch units. Please try again later.');
        console.error(err);
      }
    };

    fetchUnits();
  }, []);

  const floors = [...new Set(units.map((unit) => unit.floor))].sort((a, b) => a - b);

  const filteredUnits = selectedFloor
    ? units.filter((unit) => unit.floor === selectedFloor)
    : units;

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 pb-4 border-b">
        <button
          onClick={() => setSelectedFloor(null)}
          className={`px-4 py-2 rounded-md ${
            selectedFloor === null ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          All Floors
        </button>
        {floors.map((floor) => (
          <button
            key={floor}
            onClick={() => setSelectedFloor(floor)}
            className={`px-4 py-2 rounded-md ${
              selectedFloor === floor ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Floor {floor}
          </button>
        ))}
      </div>
      <div className="lg:max-h-[520px] lg:overflow-y-auto pr-2 -mr-2 space-y-4">
        {filteredUnits.map((unit) => (
          <UnitSelectedCard
            key={unit.id}
            unit={unit}
            isSelected={unit.id === selectedUnitId}
            onSelect={onSelectUnit}
          />
        ))}
      </div>
    </div>
  );
}

export default UnitList;