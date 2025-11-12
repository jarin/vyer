/**
 * Norwegian railway network data - comprehensive topological representation
 */

import type { RailwayData } from '../types';

/**
 * Complete Norwegian railway network data
 * Includes 100+ stations across 14 major railway lines
 */
export const railwayData: RailwayData = {
  stations: {
    // Oslo and vicinity
    'Oslo S': { x: 0, y: 0, z: 0, elevation: 0.1 },
    'Nationaltheatret': { x: -1, y: 0, z: 0.5, elevation: 0.1 },
    'Skøyen': { x: -2, y: 0, z: -0.5, elevation: 0.1 },
    'Lysaker': { x: -3, y: 0, z: -1, elevation: 0.1 },
    'Sandvika': { x: -5, y: 0, z: -2, elevation: 0.1 },
    'Asker': { x: -7, y: 0, z: -1, elevation: 0.15 },

    // Østfold line (southeast - vestre linje via Moss)
    'Loenga': { x: 1, y: 0, z: 2, elevation: 0.05 },
    'Ski': { x: 3, y: 0, z: 8, elevation: 0.2 },
    'Ås': { x: 3.5, y: 0, z: 10, elevation: 0.25 },
    'Vestby': { x: 4, y: 0, z: 14, elevation: 0.2 },
    'Moss': { x: 5, y: 0, z: 20, elevation: 0.05 },
    'Rygge': { x: 6, y: 0, z: 23, elevation: 0.1 },
    'Fredrikstad': { x: 7, y: 0, z: 28, elevation: 0.05 },
    'Sarpsborg': { x: 8, y: 0, z: 32, elevation: 0.1 },
    'Halden': { x: 10, y: 0, z: 40, elevation: 0.15 },
    'Kornsjø': { x: 12, y: 0, z: 48, elevation: 0.3 },

    // Østre linje (eastern line from Ski to Sweden)
    'Spydeberg': { x: 6, y: 0, z: 10, elevation: 0.2 },
    'Askim': { x: 8, y: 0, z: 12, elevation: 0.15 },
    'Mysen': { x: 10, y: 0, z: 14, elevation: 0.15 },
    'Rakkestad': { x: 13, y: 0, z: 18, elevation: 0.2 },

    // Gjøvik line (north from Oslo)
    'Grefsen': { x: 1, y: 0, z: -3, elevation: 0.2 },
    'Nydalen': { x: 0.5, y: 0, z: -1.5, elevation: 0.15 },
    'Roa': { x: -3, y: 0.5, z: -12, elevation: 0.8 },
    'Lunner': { x: -2, y: 0.8, z: -18, elevation: 1.2 },
    'Gjøvik': { x: -1, y: 1, z: -25, elevation: 1.5 },

    // Vestfold line (Drammen to Porsgrunn along coast)
    'Drammen': { x: -10, y: 0, z: 2, elevation: 0.1 },
    'Sande': { x: -9, y: 0, z: 6, elevation: 0.05 },
    'Holmestrand': { x: -8, y: 0, z: 8, elevation: 0.05 },
    'Tønsberg': { x: -7, y: 0, z: 12, elevation: 0.05 },
    'Sandefjord': { x: -6, y: 0, z: 15, elevation: 0.05 },
    'Larvik': { x: -5, y: 0, z: 18, elevation: 0.05 },
    'Porsgrunn': { x: -4, y: 0, z: 22, elevation: 0.1 },
    'Skien': { x: -4.5, y: 0, z: 24, elevation: 0.15 },

    // Bratsberg line (Porsgrunn to Notodden)
    'Notodden': { x: -6, y: 0.5, z: 27, elevation: 0.6 },

    // Bergen line (west from Drammen)
    'Mjøndalen': { x: -11, y: 0, z: 0, elevation: 0.15 },
    'Hokksund': { x: -12, y: 0.3, z: -2, elevation: 0.3 },
    'Vikersund': { x: -13, y: 0.5, z: -4, elevation: 0.5 },
    'Hønefoss': { x: -14, y: 0.8, z: -8, elevation: 1.2 },
    'Nesbyen': { x: -20, y: 2, z: -12, elevation: 2.5 },
    'Gol': { x: -26, y: 3.5, z: -15, elevation: 4 },
    'Ål': { x: -30, y: 4.5, z: -17, elevation: 4.8 },
    'Geilo': { x: -36, y: 6, z: -19, elevation: 6.5 },
    'Ustaoset': { x: -40, y: 7.5, z: -20, elevation: 8 },
    'Haugastøl': { x: -44, y: 8, z: -21, elevation: 8.5 },
    'Finse': { x: -48, y: 9, z: -22, elevation: 9.5 },
    'Hallingskeid': { x: -52, y: 8, z: -23, elevation: 8.8 },
    'Myrdal': { x: -56, y: 6.5, z: -24, elevation: 7 },
    'Voss': { x: -64, y: 3, z: -26, elevation: 2.5 },
    'Dale': { x: -70, y: 1.5, z: -27, elevation: 1.2 },
    'Arna': { x: -76, y: 0.5, z: -28, elevation: 0.5 },
    'Bergen': { x: -80, y: 0, z: -28, elevation: 0.1 },

    // Flåm line (branch from Myrdal)
    'Vatnahalsen': { x: -57, y: 5.5, z: -26, elevation: 6 },
    'Kjosfossen': { x: -58, y: 4, z: -28, elevation: 4.5 },
    'Berekvam': { x: -59, y: 2.5, z: -30, elevation: 3 },
    'Flåm': { x: -60, y: 0, z: -32, elevation: 0.05 },

    // Dovre line (north from Oslo)
    'Lillestrøm': { x: 4, y: 0, z: -4, elevation: 0.15 },
    'Dal': { x: 5, y: 0, z: -7, elevation: 0.2 },
    'Eidsvoll': { x: 6, y: 0, z: -12, elevation: 0.25 },
    'Minnesund': { x: 7, y: 0, z: -16, elevation: 0.3 },
    'Tangen': { x: 8, y: 0, z: -20, elevation: 0.3 },
    'Hamar': { x: 9, y: 0, z: -24, elevation: 0.35 },
    'Brumunddal': { x: 9.5, y: 0.2, z: -28, elevation: 0.5 },
    'Moelv': { x: 10, y: 0.4, z: -31, elevation: 0.7 },
    'Lillehammer': { x: 11, y: 1, z: -36, elevation: 1.5 },
    'Vinstra': { x: 11.5, y: 2, z: -42, elevation: 2.8 },
    'Otta': { x: 12, y: 3, z: -48, elevation: 3.5 },
    'Dombås': { x: 12.5, y: 4.5, z: -54, elevation: 5 },
    'Lesja': { x: 13, y: 5, z: -58, elevation: 5.5 },
    'Bjorli': { x: 13.5, y: 6, z: -62, elevation: 6.2 },
    'Åndalsnes': { x: 14.5, y: 0.5, z: -64, elevation: 0.3 },
    'Oppdal': { x: 13, y: 5.5, z: -68, elevation: 6 },
    'Støren': { x: 14, y: 2, z: -78, elevation: 2.5 },
    'Trondheim S': { x: 15, y: 0, z: -88, elevation: 0.1 },

    // Røros line (east from Oslo)
    'Elverum': { x: 16, y: 0.5, z: -18, elevation: 0.8 },
    'Koppang': { x: 20, y: 1.5, z: -26, elevation: 2 },
    'Tynset': { x: 24, y: 2.5, z: -34, elevation: 3.5 },
    'Røros': { x: 28, y: 3.5, z: -42, elevation: 5 },
    'Os': { x: 26, y: 2, z: -54, elevation: 3 },

    // Nordland line (north from Trondheim)
    'Steinkjer': { x: 16, y: 0, z: -100, elevation: 0.2 },
    'Grong': { x: 17, y: 0.5, z: -115, elevation: 0.8 },
    'Mosjøen': { x: 18, y: 0.3, z: -135, elevation: 0.5 },
    'Mo i Rana': { x: 19, y: 0.5, z: -150, elevation: 0.8 },
    'Rognan': { x: 20, y: 0.3, z: -162, elevation: 0.5 },
    'Fauske': { x: 21, y: 0.2, z: -172, elevation: 0.4 },
    'Bodø': { x: 22, y: 0, z: -185, elevation: 0.05 },

    // Sørland line (southwest from Oslo via Kongsberg)
    'Kongsberg': { x: -14, y: 0.5, z: 4, elevation: 0.8 },
    'Nordagutu': { x: -10, y: 0.3, z: 24, elevation: 0.3 },
    'Bø': { x: -8, y: 0.2, z: 26, elevation: 0.25 },
    'Lunde': { x: -12, y: 0, z: 29, elevation: 0.2 },
    'Kristiansand': { x: -28, y: 0, z: 36, elevation: 0.05 },
    'Vennesla': { x: -30, y: 0, z: 38, elevation: 0.1 },
    'Marnardal': { x: -35, y: 0, z: 40, elevation: 0.15 },
    'Egersund': { x: -48, y: 0, z: 42, elevation: 0.1 },
    'Sandnes': { x: -54, y: 0, z: 44, elevation: 0.1 },
    'Stavanger': { x: -58, y: 0, z: 45, elevation: 0.05 },

    // Meråker line (to Sweden from Trondheim)
    'Hell': { x: 16, y: 0, z: -84, elevation: 0.15 },
    'Hegra': { x: 22, y: 1, z: -80, elevation: 1.5 },
    'Meråker': { x: 30, y: 2.5, z: -78, elevation: 3.5 },
    'Storlien': { x: 38, y: 2, z: -76, elevation: 3 },
  },

  lines: [
    {
      name: 'Bergensbanen',
      color: 0xff4444,
      stations: [
        'Oslo S', 'Nationaltheatret', 'Skøyen', 'Lysaker', 'Sandvika', 'Asker', 'Drammen',
        'Mjøndalen', 'Hokksund', 'Vikersund', 'Hønefoss', 'Nesbyen', 'Gol', 'Ål', 'Geilo',
        'Ustaoset', 'Haugastøl', 'Finse', 'Hallingskeid', 'Myrdal', 'Voss', 'Dale', 'Arna', 'Bergen',
      ],
    },
    {
      name: 'Vestfoldbanen',
      color: 0x00aaff,
      stations: ['Drammen', 'Sande', 'Holmestrand', 'Tønsberg', 'Sandefjord', 'Larvik', 'Porsgrunn', 'Skien'],
    },
    {
      name: 'Bratsbergbanen',
      color: 0xaa00ff,
      stations: ['Porsgrunn', 'Notodden'],
    },
    {
      name: 'Flåmsbana',
      color: 0xff00ff,
      stations: ['Myrdal', 'Vatnahalsen', 'Kjosfossen', 'Berekvam', 'Flåm'],
    },
    {
      name: 'Dovrebanen',
      color: 0x44ff44,
      stations: [
        'Oslo S', 'Lillestrøm', 'Dal', 'Eidsvoll', 'Minnesund', 'Tangen', 'Hamar',
        'Brumunddal', 'Moelv', 'Lillehammer', 'Vinstra', 'Otta', 'Dombås', 'Lesja',
        'Oppdal', 'Støren', 'Trondheim S',
      ],
    },
    {
      name: 'Raumabanen',
      color: 0x00ffff,
      stations: ['Dombås', 'Bjorli', 'Åndalsnes'],
    },
    {
      name: 'Nordlandsbanen',
      color: 0xffaa00,
      stations: ['Trondheim S', 'Steinkjer', 'Grong', 'Mosjøen', 'Mo i Rana', 'Rognan', 'Fauske', 'Bodø'],
    },
    {
      name: 'Sørlandsbanen',
      color: 0x4444ff,
      stations: [
        'Oslo S', 'Nationaltheatret', 'Skøyen', 'Lysaker', 'Sandvika', 'Asker', 'Drammen',
        'Mjøndalen', 'Hokksund', 'Kongsberg', 'Nordagutu', 'Bø', 'Lunde', 'Kristiansand',
        'Vennesla', 'Marnardal', 'Egersund', 'Sandnes', 'Stavanger',
      ],
    },
    {
      name: 'Østfoldbanen (Vestre)',
      color: 0xff8800,
      stations: ['Oslo S', 'Loenga', 'Ski', 'Ås', 'Vestby', 'Moss', 'Rygge', 'Fredrikstad', 'Sarpsborg', 'Halden', 'Kornsjø'],
    },
    {
      name: 'Østfoldbanen (Østre)',
      color: 0xff6600,
      stations: ['Ski', 'Spydeberg', 'Askim', 'Mysen', 'Rakkestad'],
    },
    {
      name: 'Gjøvikbanen',
      color: 0x88ff00,
      stations: ['Oslo S', 'Nydalen', 'Grefsen', 'Roa', 'Lunner', 'Gjøvik'],
    },
    {
      name: 'Rørosbanen',
      color: 0xff0088,
      stations: ['Hamar', 'Elverum', 'Koppang', 'Tynset', 'Røros', 'Os', 'Trondheim S'],
    },
    {
      name: 'Meråkerbanen',
      color: 0x00ff88,
      stations: ['Trondheim S', 'Hell', 'Hegra', 'Meråker', 'Storlien'],
    },
    {
      name: 'Jærbanen',
      color: 0x8800ff,
      stations: ['Stavanger', 'Sandnes', 'Egersund'],
    },
  ],
};
