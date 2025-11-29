/**
 * Mappers per convertir DTOs del backend al format del frontend
 */

import { Location, Coord } from '../../models';
import { RefugiDTO, CoordDTO, UserRefugiInfoDTO } from '../dto/RefugiDTO';

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
function determineCondition(refugiDTO: RefugiDTO): number | undefined {
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
    info.mezzanine_etage
  ].filter(val => val === 1).length;
  
  // Si falta un mur, la condició no pot ser excel·lent
  if (info.manque_un_mur === 1) {
    return 0;
  }
  
  // Determinem la condició segons les comoditats
  if (amenities >= 8) return 3;
  if (amenities >= 5) return 2;
  if (amenities >= 3) return 1;
  return 0;
}

/**
 * Converteix un RefugiDTO al format Location del frontend
 */
export function mapRefugiFromDTO(refugiDTO: RefugiDTO): Location {
  return {
    id: refugiDTO.id,
    name: refugiDTO.name,
    surname: refugiDTO.surname || undefined,
    coord: mapCoordFromDTO(refugiDTO.coord),
    altitude: refugiDTO.altitude,
    places: refugiDTO.places,
    description: refugiDTO.description,
    links: refugiDTO.links,
    type: refugiDTO.type,
    modified_at: refugiDTO.modified_at,
    region: refugiDTO.region,
    departement: refugiDTO.departement,
    condition: refugiDTO.condition || determineCondition(refugiDTO),
    
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



export function mapperUserRefugiInfoDTO(userRefugiInfoDTO: UserRefugiInfoDTO): Location {
  const coordData = userRefugiInfoDTO.coord;
  
  if (!coordData) {
    throw new Error('Missing coordinate data in UserRefugiInfoDTO');
  }
  
  return {
    id: userRefugiInfoDTO.id,
    name: userRefugiInfoDTO.name,
    coord: mapCoordFromDTO(coordData),
    places: userRefugiInfoDTO.places,
    region: userRefugiInfoDTO.region,
  };
}

export function mapperUserRefugiInfoResponseDTO(userRefugiInfoDTOs: UserRefugiInfoDTO[]): Location[] {
  return userRefugiInfoDTOs.map(mapperUserRefugiInfoDTO);
}


