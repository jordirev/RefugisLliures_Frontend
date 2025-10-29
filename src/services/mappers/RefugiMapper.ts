/**
 * Mappers per convertir DTOs del backend al format del frontend
 */

import { Location, Coord } from '../../models';
import { RefugiDTO, CoordDTO } from '../dto/RefugiDTO';

/**
 * Converteix les coordenades del DTO al format del frontend
 */
export function mapCoordFromDTO(coordDTO: CoordDTO): Coord {
  return {
    long: coordDTO.long,
    lat: coordDTO.lat,
  };
}

/**
 * Determina la condició del refugi basant-se en info_comp
 * Aquesta és una lògica provisional - es pot millorar segons criteris reals
 */
function determineCondition(refugiDTO: RefugiDTO): "pobre" | "normal" | "bé" | "excel·lent" | undefined {
  if (!refugiDTO.info_comp) return undefined;
  
  const info = refugiDTO.info_comp;
  
  // Comptem les comoditats disponibles
  const amenities = [
    info.cheminee,
    info.poele,
    info.couvertures,
    info.latrines,
    info.bois,
    info.eau,
    info.matelas,
    info.couchage,
    info.bas_flancs,
    info.lits,
    info["mezzanine/etage"]
  ].filter(val => val === 1).length;
  
  // Si falta un mur, la condició no pot ser excel·lent
  if (info.manque_un_mur === 1) {
    return "pobre";
  }
  
  // Determinem la condició segons les comoditats
  if (amenities >= 8) return "excel·lent";
  if (amenities >= 5) return "bé";
  if (amenities >= 3) return "normal";
  return "pobre";
}

/**
 * Maps backend type string to frontend type number
 */
function mapTypeFromBackend(backendType: string | undefined): number {
  if (!backendType) return 5; // unknown
  
  const typeNormalized = backendType.toLowerCase().trim();
  
  // "cabane ouverte" -> 0 -> noGuarded
  if (typeNormalized.includes('cabane ouverte') && !typeNormalized.includes('berger')) {
    return 0;
  }
  
  // "cabane ouverte mais ocupee par le berger l ete" -> 1 -> occupiedInSummer
  if (typeNormalized.includes('berger')) {
    return 1;
  }
  
  // "Fermée" or "cabane fermee" -> 2 -> closed
  if (typeNormalized.includes('fermée') || typeNormalized.includes('fermee')) {
    return 2;
  }
  
  // "orri toue abri en pierre" -> 3 -> shelter
  if (typeNormalized.includes('orri') || typeNormalized.includes('abri en pierre')) {
    return 3;
  }
  
  // "emergence" -> 4 -> emergency
  if (typeNormalized.includes('emergence')) {
    return 4;
  }
  
  // null or unknown -> 5 -> unknown
  return 5;
}

/**
 * Converteix un RefugiDTO al format Location del frontend
 */
export function mapRefugiFromDTO(refugiDTO: RefugiDTO): Location {
  return {
    id: parseInt(refugiDTO.id, 10),
    name: refugiDTO.name,
    surname: refugiDTO.surname || undefined,
    coord: mapCoordFromDTO(refugiDTO.coord),
    altitude: refugiDTO.altitude,
    places: refugiDTO.places,
    description: refugiDTO.description,
    links: refugiDTO.links,
    type: mapTypeFromBackend(refugiDTO.type),
    modified_at: refugiDTO.modified_at,
    region: refugiDTO.region,
    departement: refugiDTO.departement,
    condition: determineCondition(refugiDTO),
    
    // Propietats addicionals del frontend
    imageUrl: undefined, // No ve del backend

  };
}

/**
 * Converteix un array de RefugiDTO al format Location[]
 */
export function mapRefugisFromDTO(refugisDTO: RefugiDTO[]): Location[] {
  return refugisDTO.map(mapRefugiFromDTO);
}
