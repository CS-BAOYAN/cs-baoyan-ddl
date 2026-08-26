declare module '$data/logos.json' {
  const map: Record<string, string>;
  export default map;
}

declare module '$data/extended.json' {
  import type { ExtendedData } from '$lib/types';
  const data: ExtendedData;
  export default data;
}
