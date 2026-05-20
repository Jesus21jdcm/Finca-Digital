export interface TaskDefault {
  nombre: string;
  dia: number;
}

export interface CropCatalogItem {
  id: string;
  key: string;
  emoji: string;
  ciclo: string;
  duracion: number;
  agua: string;
  color: string;
  bg: string;
  alerta: string;
  densidad: number;
  unidad: string;
  descRequerimiento: string;
  tareasDefault: TaskDefault[];
}

export const CROP_TYPES = {
  MAIZ: 'Maíz',
  CACAO: 'Cacao',
  YUCA: 'Yuca',
  PLATANO: 'Plátano'
} as const;

export type CropKeyType = typeof CROP_TYPES[keyof typeof CROP_TYPES];

export const CROP_CATALOG: CropCatalogItem[] = [
  {
    id: 'maiz',
    key: CROP_TYPES.MAIZ,
    emoji: '🌽',
    ciclo: '100 – 120 días',
    duracion: 120,
    agua: 'Crítica',
    color: '#c8860a',
    bg: 'linear-gradient(135deg, #fff9ee 0%, #fef0cc 100%)',
    alerta: 'Control de maleza / Fertilización nitrogenada días 25 y 45.',
    densidad: 1.5,
    unidad: 'Sacos',
    descRequerimiento: 'Requerimiento: 1.5 sacos por hectárea',
    tareasDefault: [
      { nombre: "Preparación de suelo", dia: 0 },
      { nombre: "Siembra", dia: 0 },
      { nombre: "Reabonado N/P (1ra aplicación)", dia: 25 },
      { nombre: "Reabonado N/P (2da aplicación)", dia: 45 },
      { nombre: "Cosecha estimada", dia: 120 },
    ]
  },
  {
    id: 'cacao',
    key: CROP_TYPES.CACAO,
    emoji: '🍫',
    ciclo: '5 – 6 meses',
    duracion: 180,
    agua: 'Alta',
    color: '#8B4513',
    bg: 'linear-gradient(135deg, #fdf5ee 0%, #f5dfc8 100%)',
    alerta: 'Poda de mantenimiento / Control de Monilia.',
    densidad: 5,
    unidad: 'Sacos',
    descRequerimiento: 'Requerimiento: 5 sacos por hectárea',
    tareasDefault: [
      { nombre: "Siembra / Trasplante", dia: 0 },
      { nombre: "Poda de mantenimiento", dia: 30 },
      { nombre: "Manejo de sombra", dia: 45 },
      { nombre: "Fertilización foliar", dia: 60 },
      { nombre: "Control de malezas", dia: 90 },
      { nombre: "Poda fitosanitaria", dia: 120 },
      { nombre: "Control Monilia", dia: 150 },
      { nombre: "Cosecha", dia: 180 }
    ]
  },
  {
    id: 'yuca',
    key: CROP_TYPES.YUCA,
    emoji: '🥔',
    ciclo: '8 – 12 meses',
    duracion: 270,
    agua: 'Baja',
    color: '#e07b54',
    bg: 'linear-gradient(135deg, #fff5f0 0%, #fde8df 100%)',
    alerta: 'Punto de almidón (suelo seco para arranque).',
    densidad: 4,
    unidad: 'Sacos',
    descRequerimiento: 'Requerimiento: 4 sacos por hectárea',
    tareasDefault: [
      { nombre: "Selección de estacas", dia: 0 },
      { nombre: "Siembra", dia: 0 },
      { nombre: "Desmalezado temprano", dia: 30 },
      { nombre: "Aporque y fertilización", dia: 60 },
      { nombre: "Control maleza", dia: 120 },
      { nombre: "Fertilización tardía", dia: 180 },
      { nombre: "Arranque", dia: 270 }
    ]
  },
  {
    id: 'platano',
    key: CROP_TYPES.PLATANO,
    emoji: '🍌',
    ciclo: '9 – 11 meses',
    duracion: 300,
    agua: 'Muy Alta',
    color: '#3a9e8a',
    bg: 'linear-gradient(135deg, #eef8f5 0%, #d5f0e8 100%)',
    alerta: 'Deshije / Apuntalamiento de racimos.',
    densidad: 6,
    unidad: 'Sacos',
    descRequerimiento: 'Requerimiento: 6 sacos por hectárea',
    tareasDefault: [
      { nombre: "Siembra de hijuelos", dia: 0 },
      { nombre: "Deshoje y deshije", dia: 45 },
      { nombre: "Fertilización potásica", dia: 90 },
      { nombre: "Control maleza", dia: 120 },
      { nombre: "Embolsado de racimo", dia: 210 },
      { nombre: "Apuntalamiento", dia: 240 },
      { nombre: "Cosecha del racimo", dia: 300 }
    ]
  }
];

export const getCropMetadata = (key: string): CropCatalogItem => {
  return CROP_CATALOG.find(c => c.key === key) || CROP_CATALOG[0];
};

export const normalizeCropKey = (key: string): string => {
  return key.toLowerCase()
    .replace('á', 'a').replace('í', 'i').replace('ó', 'o').replace('ú', 'u');
};
