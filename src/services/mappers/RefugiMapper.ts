/**
 * Mappers per convertir DTOs del backend al format del frontend
 */

import { Location, Coord } from '../../types';
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
 * Converteix un RefugiDTO al format Location del frontend
 */
export function mapRefugiFromDTO(refugiDTO: RefugiDTO): Location {
  return {
    id: parseInt(refugiDTO.id, 10),
    name: refugiDTO.name,
    coord: mapCoordFromDTO(refugiDTO.coord),
    altitude: refugiDTO.altitude,
    places: refugiDTO.places,
    description: refugiDTO.description || refugiDTO.remarque,
    links: refugiDTO.links,
    type: refugiDTO.type,
    modified_at: refugiDTO.modified_at,
    region: refugiDTO.region,
    departement: refugiDTO.departement,
    condition: determineCondition(refugiDTO),
    
    // Propietats addicionals del frontend
    isFavorite: false, // S'establirà després si cal
    imageUrl: undefined, // No ve del backend
    distance: undefined, // Es calcularà al frontend
    
    // Compatibilitat amb camps antics
    elevation: refugiDTO.altitude,
    capacity: refugiDTO.places,
  };
}

/**
 * Converteix un array de RefugiDTO al format Location[]
 */
export function mapRefugisFromDTO(refugisDTO: RefugiDTO[]): Location[] {
  return refugisDTO.map(mapRefugiFromDTO);
}
