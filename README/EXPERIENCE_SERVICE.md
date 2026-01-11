# Experience Service - Documentació

Aquest document descriu com utilitzar el servei d'experiències i els seus hooks associats.

## Estructura de fitxers creats

```
src/
├── services/
│   ├── ExperienceService.ts          # Servei amb les crides a l'API
│   ├── dto/
│   │   └── ExperienceDTO.ts          # DTOs per les respostes del backend
│   └── mappers/
│       └── ExperienceMapper.ts       # Mappers DTO → Model
└── hooks/
    └── useExperiencesQuery.ts        # Hooks React Query
```

## Model d'Experience

El model ja existia i conté tots els atributs necessaris:

```typescript
interface Experience {
  id: string;
  refuge_id: string;
  creator_uid: string;
  modified_at: string; // Format: DD/MM/YYYY del backend
  comment: string;
  images_metadata?: ImageMetadata[];
}
```

## API Endpoints

### 1. Obtenir experiències d'un refugi
**GET** `/api/experiences/?refuge_id={refuge_id}`

```typescript
const experiencesDTO = await ExperienceService.getExperiencesByRefuge(refugeId);
```

**Errors possibles:**
- 400: refuge_id no proporcionat
- 404: Refugi no trobat
- 500: Error intern del servidor

### 2. Crear una nova experiència
**POST** `/api/experiences/`

```typescript
const response = await ExperienceService.createExperience({
  refuge_id: 'refuge123',
  comment: 'Experiència fantàstica!',
  files: [file1, file2] // Opcional
});
```

**Request:** Multipart/form-data amb:
- `refuge_id` (requerit)
- `comment` (requerit)
- `files` (opcional): Array de File

**Response:**
```typescript
{
  experience: ExperienceDTO;
  uploaded_files?: string[];  // Keys dels fitxers pujats
  failed_files?: string[];    // Noms de fitxers que han fallat
  message?: string;           // Missatge d'error parcial
}
```

**Errors possibles:**
- 400: Dades invàlides
- 401: No autenticat
- 404: Refugi no trobat
- 500: Error intern (pot retornar l'experiència creada amb missatge d'error parcial)

### 3. Actualitzar una experiència
**PATCH** `/api/experiences/{experience_id}/`

```typescript
const response = await ExperienceService.updateExperience(experienceId, {
  comment: 'Comentari actualitzat',
  files: [file1] // Opcional
});
```

**Request:** Multipart/form-data amb:
- `comment` (opcional)
- `files` (opcional): Array de File per afegir noves imatges

**Response:**
```typescript
{
  experience?: ExperienceDTO;
  uploaded_files?: string[];
  failed_files?: string[];
  message?: string;
}
```

**Errors possibles:**
- 400: Dades invàlides
- 401: No autenticat
- 403: No tens permisos (no ets el creador)
- 404: Experiència no trobada
- 500: Error intern

**Nota:** Per eliminar fotos d'experiències, utilitzar l'endpoint de mitjans del refugi:
`DELETE /api/refuges/{id}/media/{key}/`

### 4. Eliminar una experiència
**DELETE** `/api/experiences/{experience_id}/`

```typescript
await ExperienceService.deleteExperience(experienceId);
```

**Errors possibles:**
- 401: No autenticat
- 403: No tens permisos (no ets el creador)
- 404: Experiència no trobada
- 500: Error intern

## React Query Hooks

### useExperiences

Obté totes les experiències d'un refugi.

```typescript
import { useExperiences } from '../hooks/useExperiencesQuery';

function MyComponent({ refugeId }) {
  const { data: experiences, isLoading, error } = useExperiences(refugeId);
  
  if (isLoading) return <Text>Carregant...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  
  return (
    <View>
      {experiences?.map(exp => (
        <Text key={exp.id}>{exp.comment}</Text>
      ))}
    </View>
  );
}
```

### useCreateExperience

Crea una nova experiència i l'afegeix automàticament a la cache.

```typescript
import { useCreateExperience } from '../hooks/useExperiencesQuery';

function CreateExperienceForm({ refugeId }) {
  const createMutation = useCreateExperience();
  
  const handleSubmit = async (comment: string, files: File[]) => {
    try {
      const result = await createMutation.mutateAsync({
        refuge_id: refugeId,
        comment,
        files
      });
      
      console.log('Created:', result.experience);
      console.log('Uploaded files:', result.uploaded_files);
      
      if (result.failed_files && result.failed_files.length > 0) {
        console.warn('Failed files:', result.failed_files);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // ...
}
```

**Optimització:** Afegeix la nova experiència al principi de la llista sense invalidar la query.

### useUpdateExperience

Actualitza una experiència existent i actualitza automàticament la cache.

```typescript
import { useUpdateExperience } from '../hooks/useExperiencesQuery';

function EditExperienceForm({ experienceId, refugeId }) {
  const updateMutation = useUpdateExperience();
  
  const handleSubmit = async (comment?: string, files?: File[]) => {
    try {
      const result = await updateMutation.mutateAsync({
        experienceId,
        refugeId,
        request: { comment, files }
      });
      
      console.log('Updated:', result.experience);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // ...
}
```

**Optimització:** Actualitza només l'experiència modificada a la cache sense invalidar la query.

### useDeleteExperience

Elimina una experiència i l'elimina automàticament de la cache.

```typescript
import { useDeleteExperience } from '../hooks/useExperiencesQuery';

function ExperienceItem({ experience, refugeId }) {
  const deleteMutation = useDeleteExperience();
  
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        experienceId: experience.id,
        refugeId
      });
      
      console.log('Deleted successfully');
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // ...
}
```

**Optimització:** Elimina l'experiència de la llista a la cache sense invalidar la query.

## Gestió d'errors

Tots els mètodes del servei llancen errors amb missatges descriptius en català:

```typescript
try {
  const experiences = await ExperienceService.getExperiencesByRefuge(refugeId);
} catch (error) {
  if (error instanceof Error) {
    // Errors possibles:
    // - "El refuge_id és requerit"
    // - "Refugi no trobat"
    // - "No s'han pogut carregar les experiències"
    console.error(error.message);
  }
}
```

## Optimitzacions React Query

Els hooks implementen optimitzacions per evitar invalidar tota la cache:

1. **useCreateExperience**: Afegeix la nova experiència al principi de la llista (ordenada per `modified_at` descendent)
2. **useUpdateExperience**: Actualitza només l'experiència modificada a la llista
3. **useDeleteExperience**: Elimina només l'experiència eliminada de la llista

Això millora el rendiment i evita crides innecessàries al backend.

## Exemple complet

```typescript
import React, { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { 
  useExperiences, 
  useCreateExperience, 
  useDeleteExperience 
} from '../hooks/useExperiencesQuery';

function ExperiencesScreen({ refugeId }) {
  const [comment, setComment] = useState('');
  
  const { data: experiences, isLoading } = useExperiences(refugeId);
  const createMutation = useCreateExperience();
  const deleteMutation = useDeleteExperience();
  
  const handleCreate = async () => {
    await createMutation.mutateAsync({
      refuge_id: refugeId,
      comment,
      files: [] // Sense fitxers en aquest exemple
    });
    setComment('');
  };
  
  const handleDelete = async (experienceId: string) => {
    await deleteMutation.mutateAsync({
      experienceId,
      refugeId
    });
  };
  
  if (isLoading) return <Text>Carregant...</Text>;
  
  return (
    <View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Escriu la teva experiència..."
      />
      <Button title="Crear" onPress={handleCreate} />
      
      {experiences?.map(exp => (
        <View key={exp.id}>
          <Text>{exp.comment}</Text>
          <Button 
            title="Eliminar" 
            onPress={() => handleDelete(exp.id)} 
          />
        </View>
      ))}
    </View>
  );
}
```

## Notes importants

1. **Multipart/form-data**: Els endpoints POST i PATCH utilitzen `FormData` per enviar fitxers
2. **Autenticació**: Tots els endpoints requereixen autenticació via Bearer token (gestionat automàticament per `apiClient`)
3. **Permisos**: Només el creador pot actualitzar o eliminar la seva experiència
4. **Errors parcials**: Si es crea/actualitza una experiència però falla la pujada d'alguns fitxers, el backend retorna l'experiència creada amb informació sobre els fitxers que han fallat
5. **Eliminar fotos**: Per eliminar fotos d'experiències, cal utilitzar l'endpoint de mitjans del refugi, no el d'experiències
