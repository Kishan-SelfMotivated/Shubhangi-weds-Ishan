export interface InvitationEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  mapUrl: string;
  theme: 'saffron' | 'royal-gold' | 'marigold' | 'maroon' | 'neon' | 'red' | 'black-gold' | 'white';
  imageUrl: string;
  description?: string;
}

export const WEDDING_DATE = new Date('2026-06-21T10:00:00');

export const EVENTS: InvitationEvent[] = [
  {
    id: 'maata-poojan',
    title: 'Maata Poojan',
    date: '18th June 2026',
    time: '9 AM Onwards',
    venue: 'Home, Itarsi',
    mapUrl: 'https://maps.app.goo.gl/fjQaara3MRMtXcbk8',
    theme: 'saffron',
    imageUrl: 'https://img.freepik.com/free-vector/shish-ganesha-lord-ganpatis-symbol-wedding-card_1017-38663.jpg',
  },
  {
    id: 'blessings',
    title: 'Blessings Ceremony & Dinner',
    date: '18th June 2026',
    time: '7 PM Onwards',
    venue: 'Sai Krishna Resort, Hoshangabad Road, Itarsi',
    mapUrl: 'https://maps.app.goo.gl/wbhorcFPCigLyGtq7',
    theme: 'royal-gold',
    imageUrl: 'https://img.freepik.com/free-vector/shish-ganesha-lord-ganpatis-symbol-wedding-card_1017-38663.jpg',
  },
  {
    id: 'haldi',
    title: 'Haldi & Mandap',
    date: '19th June 2026',
    time: '10 AM Onwards',
    venue: 'Home, Itarsi',
    mapUrl: 'https://maps.app.goo.gl/fjQaara3MRMtXcbk8',
    theme: 'marigold',
    imageUrl: '/assets/wedding-haldi-ceremony-couple.png',
  },
  {
    id: 'faldaan',
    title: 'Faldaan & Ring Ceremony',
    date: '20th June 2026',
    time: '3 PM Onwards',
    venue: 'Hotel Imperial Grand, Near Over Bridge, Hari Fatak, Ujjain',
    mapUrl: 'https://maps.app.goo.gl/VoY4q9jZtrrDg8HJ8',
    theme: 'maroon',
    imageUrl: 'https://img.freepik.com/free-vector/shish-ganesha-lord-ganpatis-symbol-wedding-card_1017-38663.jpg',
  },
  {
    id: 'sangeet',
    title: 'Sangeet Night',
    date: '20th June 2026',
    time: '7 PM Onwards',
    venue: 'Hotel Imperial Grand, Near Over Bridge, Hari Fatak, Ujjain',
    mapUrl: 'https://maps.app.goo.gl/VoY4q9jZtrrDg8HJ8',
    theme: 'neon',
    imageUrl: 'https://img.freepik.com/free-vector/shish-ganesha-lord-ganpatis-symbol-wedding-card_1017-38663.jpg',
  },
  {
    id: 'phere',
    title: 'Phere',
    date: '21st June 2026',
    time: '10 AM Onwards',
    venue: 'Hotel Imperial Grand, Near Over Bridge, Hari Fatak, Ujjain',
    mapUrl: 'https://maps.app.goo.gl/VoY4q9jZtrrDg8HJ8',
    theme: 'red',
    imageUrl: '/assets/wedding-phere.png',
  },
  {
    id: 'reception',
    title: 'Reception',
    date: '21st June 2026',
    time: '7 PM Onwards',
    venue: 'Hotel Imperial Grand, Near Over Bridge, Hari Fatak, Ujjain',
    mapUrl: 'https://maps.app.goo.gl/VoY4q9jZtrrDg8HJ8',
    theme: 'white',
    imageUrl: 'https://img.freepik.com/free-vector/shish-ganesha-lord-ganpatis-symbol-wedding-card_1017-38663.jpg',
  },
];
