/**
 * Substitut de `UNSAFE_getAllByType` / `findAllByType` (eliminats a RNTL 14).
 *
 * Test Renderer només exposa elements host (View, Text, ...). Per cercar per
 * component (p. ex. `TouchableOpacity`) recorrem la fibra de cada host fins a
 * trobar un ancestre compost del tipus demanat i retornem el host més extern
 * d'aquest component. `fireEvent` el tracta com qualsevol altre element.
 */
import type { TestInstance } from 'test-renderer';

type AnyType = any;

const fiberMatches = (fiber: any, type: AnyType): boolean => {
  const t = fiber.type;
  const et = fiber.elementType;
  if (t === type || et === type) return true;
  // memo / forwardRef: el tipus real és a .type de l'embolcall
  if (t && typeof t === 'object' && (t.type === type || t.render === type)) return true;
  if (et && typeof et === 'object' && (et.type === type || et.render === type)) return true;
  return false;
};

/** Retorna la fibra composta més propera d'`instance` que coincideix amb `type`. */
const matchingFiber = (instance: TestInstance | null, type: AnyType): any => {
  let fiber = instance?.unstable_fiber?.return ?? null;
  while (fiber) {
    if (fiberMatches(fiber, type)) return fiber;
    fiber = fiber.return;
  }
  return null;
};

export const findAllByType = (root: TestInstance, type: AnyType): TestInstance[] => {
  if (typeof type === 'string') {
    return root.queryAll((n) => n.type === type);
  }
  return root.queryAll((n) => {
    const fiber = matchingFiber(n, type);
    if (!fiber) return false;
    // Només el host més extern de cada instància del component
    return !n.parent || matchingFiber(n.parent, type) !== fiber;
  });
};

/** Props del component compost (no de l'host) més proper d'`instance` del tipus indicat. */
export const getComponentProps = (instance: TestInstance, type: AnyType): Record<string, any> | undefined =>
  matchingFiber(instance, type)?.memoizedProps;

export const findByType = (root: TestInstance, type: AnyType): TestInstance => {
  const all = findAllByType(root, type);
  if (all.length !== 1) {
    throw new Error(`findByType: s'esperava 1 element i n'hi ha ${all.length}`);
  }
  return all[0];
};
