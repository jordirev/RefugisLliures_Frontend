/**
 * Mappers per convertir DTOs del backend al format del frontend
 */

import { Location, Coord, ImageMetadata } from '../../models';
import { 
  RefugiDTO, 
  RefugiBodyDTO, 
  CoordDTO, 
  UserRefugiInfoDTO, 
  ImageMetadataDTO 
} from '../dto/RefugiDTO';

/**
 * Converteix les coordenades del DTO al format del frontend
 */
export function mapCoordFromDTO(coordDTO: CoordDTO): Coord {
  return {
    long: coordDTO.long,
    lat: coordDTO.lat,
  };
}

export function mapInfoCompFromDTO(infoCompDTO: any | undefined): any | undefined {
  if (!infoCompDTO) return undefined;
  return {
    manque_un_mur: infoCompDTO.manque_un_mur === 1 ? true : false,
    cheminee: infoCompDTO.cheminee === 1 ? true : false,
    poele: infoCompDTO.poele === 1 ? true : false,
    couvertures: infoCompDTO.couvertures === 1 ? true : false,
    latrines: infoCompDTO.latrines === 1 ? true : false,
    bois: infoCompDTO.bois === 1 ? true : false,
    eau: infoCompDTO.eau === 1 ? true : false,
    matelas: infoCompDTO.matelas === 1 ? true : false,
    couchage: infoCompDTO.couchage === 1 ? true : false,
    bas_flancs: infoCompDTO.bas_flancs === 1 ? true : false,
    lits: infoCompDTO.lits === 1 ? true : false,
    mezzanine_etage: infoCompDTO.mezzanine_etage === 1 ? true : false,
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

export function mapImageMetadataFromDTO(imageDTO: ImageMetadataDTO): ImageMetadata {
  return {
    key: imageDTO.key,
    url: imageDTO.url,
    uploaded_at: imageDTO.uploaded_at,
    creator_uid: imageDTO.creator_uid,
    experience_id: imageDTO.experience_id,
  };
}

/**
 * Converteix un RefugiDTO al format Location del frontend
 */
export function mapRefugiFromDTO(refugiDTO: RefugiDTO): Location {
  try {
    if (!refugiDTO.coord) {
      console.warn('[RefugiMapper] Missing coord for refuge:', refugiDTO.id || 'unknown');
    }
    
    return {
      id: refugiDTO.id,
      name: refugiDTO.name,
      surname: refugiDTO.surname || undefined,
      coord: refugiDTO.coord ? mapCoordFromDTO(refugiDTO.coord) : { lat: 0, long: 0 },
      altitude: refugiDTO.altitude,
      places: refugiDTO.places,
      info_comp: mapInfoCompFromDTO(refugiDTO.info_comp),
      description: refugiDTO.description,
      links: refugiDTO.links,
      type: refugiDTO.type,
      modified_at: refugiDTO.modified_at,
      region: refugiDTO.region,
      departement: refugiDTO.departement,
      condition: refugiDTO.condition || determineCondition(refugiDTO),
      visitors: refugiDTO.visitors,
      images_metadata: refugiDTO.images_metadata ? refugiDTO.images_metadata.map(mapImageMetadataFromDTO) : undefined,
    };
  } catch (error) {
    console.error('[RefugiMapper] Error mapping refuge:', refugiDTO?.id || 'unknown', error);
    console.error('[RefugiMapper] DTO:', JSON.stringify(refugiDTO));
    throw error;
  }
}

/**
 * Converteix un array de RefugiDTO al format Location[]
 */
export function mapRefugisFromDTO(refugisDTO: RefugiDTO[]): Location[] {
  return refugisDTO.map(mapRefugiFromDTO);
}

/**
 * Converteix un UserRefugiInfoDTO al format Location del frontend 
 */
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

/**
 * Converteix un array de UserRefugiInfoDTO al format Location[]
 */
export function mapperUserRefugiInfoResponseDTO(userRefugiInfoDTOs: UserRefugiInfoDTO[]): Location[] {
  return userRefugiInfoDTOs.map(mapperUserRefugiInfoDTO);
}

/**
 * Converteix les coordenades del frontend al format DTO
 */
export function mapCoordToDTO(coord: Coord): CoordDTO {
  return {
    long: coord.long,
    lat: coord.lat,
  };
}

/**
 * Converteix la informació complementària del frontend al format DTO
 */
export function mapInfoCompToDTO(infoComp: any | undefined): any | undefined {
  if (!infoComp) return undefined;
  return {
    manque_un_mur: infoComp.manque_un_mur ? 1 : 0,
    cheminee: infoComp.cheminee ? 1 : 0,
    poele: infoComp.poele ? 1 : 0,
    couvertures: infoComp.couvertures ? 1 : 0,
    latrines: infoComp.latrines ? 1 : 0,
    bois: infoComp.bois ? 1 : 0,
    eau: infoComp.eau ? 1 : 0,
    matelas: infoComp.matelas ? 1 : 0,
    couchage: infoComp.couchage ? 1 : 0,
    bas_flancs: infoComp.bas_flancs ? 1 : 0,
    lits: infoComp.lits ? 1 : 0,
    mezzanine_etage: infoComp.mezzanine_etage ? 1 : 0,
  };
}

/**
 * Converteix un Partial<Location> del frontend al format Partial<RefugiDTO> per al backend
 * Útil per a actualitzacions parcials (només els camps que es volen modificar)
 */
export function mapPartialRefugiToDTO(location: Partial<Location>, action: String): Partial<RefugiBodyDTO> {
  const dto: Partial<RefugiBodyDTO> = {};

  if (action === 'create' && (!location.name || !location.coord)) {
    throw new Error('Name and coordinate data is mandatory in UserRefugiInfoDTO');
  }
  
  if (location.name !== undefined) dto.name = location.name;
  if (location.surname !== undefined) dto.surname = location.surname || null;
  if (location.coord !== undefined && location.coord !== null) dto.coord = mapCoordToDTO(location.coord);
  if (location.altitude !== undefined) dto.altitude = location.altitude ?? null;
  if (location.places !== undefined) dto.places = location.places ?? null;
  if (location.info_comp !== undefined) dto.info_comp = mapInfoCompToDTO(location.info_comp);
  if (location.description !== undefined) dto.description = location.description;
  if (location.links !== undefined) dto.links = location.links;
  if (location.type !== undefined) dto.type = location.type;
  if (location.region !== undefined) dto.region = location.region ?? null;
  if (location.departement !== undefined) dto.departement = location.departement ?? null;
  if (location.condition !== undefined) dto.condition = location.condition;
    
  return dto;
}
