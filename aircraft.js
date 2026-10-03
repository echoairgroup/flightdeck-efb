export const AIRCRAFT = [
  ["A20N","Airbus A320neo","Airbus","Airliner"],["A21N","Airbus A321neo","Airbus","Airliner"],
  ["A19N","Airbus A319neo","Airbus","Airliner"],["A320","Airbus A320","Airbus","Airliner"],
  ["A321","Airbus A321","Airbus","Airliner"],["A330","Airbus A330-300","Airbus","Airliner"],
  ["A339","Airbus A330-900neo","Airbus","Airliner"],["A350","Airbus A350-900","Airbus","Airliner"],
  ["A359","Airbus A350-900","Airbus","Airliner"],["A35K","Airbus A350-1000","Airbus","Airliner"],
  ["A380","Airbus A380-800","Airbus","Airliner"],["B738","Boeing 737-800","Boeing","Airliner"],
  ["B38M","Boeing 737 MAX 8","Boeing","Airliner"],["B39M","Boeing 737 MAX 9","Boeing","Airliner"],
  ["B3XM","Boeing 737 MAX 10","Boeing","Airliner"],["B752","Boeing 757-200","Boeing","Airliner"],
  ["B763","Boeing 767-300","Boeing","Airliner"],["B764","Boeing 767-400","Boeing","Airliner"],
  ["B772","Boeing 777-200","Boeing","Airliner"],["B77W","Boeing 777-300ER","Boeing","Airliner"],
  ["B78X","Boeing 787-10","Boeing","Airliner"],["B789","Boeing 787-9","Boeing","Airliner"],
  ["B788","Boeing 787-8","Boeing","Airliner"],["B748","Boeing 747-8","Boeing","Airliner"],
  ["E170","Embraer E170","Embraer","Regional"],["E175","Embraer E175","Embraer","Regional"],
  ["E190","Embraer E190","Embraer","Regional"],["E195","Embraer E195","Embraer","Regional"],
  ["E290","Embraer E190-E2","Embraer","Regional"],["E295","Embraer E195-E2","Embraer","Regional"],
  ["CRJ9","CRJ-900","Bombardier","Regional"],["CRJX","CRJ-1000","Bombardier","Regional"],
  ["AT76","ATR 72-600","ATR","Turboprop"],["AT46","ATR 42-600","ATR","Turboprop"],
  ["DH8D","Dash 8 Q400","De Havilland","Turboprop"],["C172","Cessna 172","Cessna","GA"],
  ["C152","Cessna 152","Cessna","GA"],["C208","Cessna Caravan","Cessna","Utility"],
  ["PC12","Pilatus PC-12","Pilatus","Turboprop"],["PC24","Pilatus PC-24","Pilatus","Jet"],
  ["TBM9","Daher TBM 900","Daher","Turboprop"],["GLF6","Gulfstream G650","Gulfstream","Business"],
  ["GLF7","Gulfstream G700","Gulfstream","Business"],["C680","Citation Longitude","Cessna","Business"],
  ["C700","Citation Latitude","Cessna","Business"],["CL60","Challenger 650","Bombardier","Business"],
  ["F16","F-16 Fighting Falcon","Lockheed Martin","Military"],["F18","F/A-18 Super Hornet","Boeing","Military"],
  ["IL76","Ilyushin Il-76","Ilyushin","Cargo"],["AN24","Antonov An-24","Antonov","Turboprop"],
  ["AN12","Antonov An-12","Antonov","Cargo"],["MD11","McDonnell Douglas MD-11","McDonnell Douglas","Airliner"],
  ["MD82","McDonnell Douglas MD-82","McDonnell Douglas","Airliner"],["DC3","Douglas DC-3","Douglas","Classic"],
  ["CONC","Concorde","BAC/Aérospatiale","Classic"],["IL18","Ilyushin Il-18","Ilyushin","Classic"],
  ["P180","Piaggio P.180","Piaggio","Business"],["PC21","Pilatus PC-21","Pilatus","Trainer"]
].map(([icao,name,manufacturer,category]) => ({icao,name,manufacturer,category}));

export function aircraftByCode(code) {
  return AIRCRAFT.find(a => a.icao === code) || AIRCRAFT[1];
}
