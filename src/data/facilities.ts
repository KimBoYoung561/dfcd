import { Facility } from '../types';
import { ANYANG_AIR_PUMPS } from './airPumps';
import { ANYANG_WATER_FOUNTAINS } from './waterFountains';
import { ANYANG_BIKE_RACKS } from './bikeRacks';

export const CURATED_RESTROOMS: Facility[] = [];

export const ANYANG_FACILITIES: Facility[] = [
  ...ANYANG_BIKE_RACKS,
  ...ANYANG_AIR_PUMPS,
  ...ANYANG_WATER_FOUNTAINS,
];
