export interface Palette {
  code: string;
  name: string;
  primary: string;
  secondary: string;
  preview: string[];
  description: string;
}

export const PALETTES: Palette[] = [
  {
    code: 'BLUSH',
    name: 'Rosa Blush',
    primary: '#C9837A',
    secondary: '#FDF0EE',
    preview: ['#C9837A', '#F7D6D3', '#FDF0EE'],
    description: 'Delicado, feminino e atemporal'
  },
  {
    code: 'SAGE',
    name: 'Sálvia Verde',
    primary: '#8A9E8C',
    secondary: '#EEF3EE',
    preview: ['#8A9E8C', '#C8D8C9', '#EEF3EE'],
    description: 'Natural, sereno e elegante'
  },
  {
    code: 'CHAMPAGNE',
    name: 'Champagne',
    primary: '#B59A6A',
    secondary: '#FAF5EC',
    preview: ['#B59A6A', '#E8D9BE', '#FAF5EC'],
    description: 'Sofisticado, quente e clássico'
  },
  {
    code: 'LAVENDER',
    name: 'Lavanda',
    primary: '#9189A8',
    secondary: '#F2F0F8',
    preview: ['#9189A8', '#D4CEEA', '#F2F0F8'],
    description: 'Romântico, suave e poético'
  },
  {
    code: 'SKY',
    name: 'Azul Celeste',
    primary: '#7A9EB5',
    secondary: '#EDF4F8',
    preview: ['#7A9EB5', '#BCD4E4', '#EDF4F8'],
    description: 'Fresco, sereno e delicado'
  },
  {
    code: 'DUSTY_ROSE',
    name: 'Rosa Antigo',
    primary: '#B17D8A',
    secondary: '#F8EDEE',
    preview: ['#B17D8A', '#DDB8BF', '#F8EDEE'],
    description: 'Vintage, intimista e charmoso'
  },
];
