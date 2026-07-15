// The 12 nations (real countries; clubs, competitions and people are fictional).
// Name pools drive deterministic generation of people and clubs per nation.
import type { Nation, NationId } from '../types/core';

export const NATIONS: Nation[] = [
  { id: 'brazil', name: 'Brazil', demonym: 'Brazilian', climate: 'hot', continent: 'americas', strength: 82, leagueName: 'Série Ouro', cupName: 'Copa Nacional' },
  { id: 'argentina', name: 'Argentina', demonym: 'Argentine', climate: 'temperate', continent: 'americas', strength: 81, leagueName: 'Primera del Sol', cupName: 'Copa de Plata' },
  { id: 'spain', name: 'Spain', demonym: 'Spanish', climate: 'temperate', continent: 'europe', strength: 84, leagueName: 'Liga Corona', cupName: 'Copa del Rey Viejo' },
  { id: 'france', name: 'France', demonym: 'French', climate: 'temperate', continent: 'europe', strength: 83, leagueName: 'Ligue Tricolore', cupName: 'Coupe Lumière' },
  { id: 'morocco', name: 'Morocco', demonym: 'Moroccan', climate: 'hot', continent: 'africa', strength: 74, leagueName: 'Botola Atlas', cupName: 'Coupe du Trône Vert' },
  { id: 'south_africa', name: 'South Africa', demonym: 'South African', climate: 'temperate', continent: 'africa', strength: 68, leagueName: 'Gold Coast League', cupName: 'Protea Cup' },
  { id: 'nigeria', name: 'Nigeria', demonym: 'Nigerian', climate: 'hot', continent: 'africa', strength: 73, leagueName: 'Naija Premier', cupName: 'Federation Shield' },
  { id: 'japan', name: 'Japan', demonym: 'Japanese', climate: 'temperate', continent: 'asia', strength: 76, leagueName: 'Nadeshiko League', cupName: "Emperor's Lantern Cup" },
  { id: 'china', name: 'China', demonym: 'Chinese', climate: 'temperate', continent: 'asia', strength: 66, leagueName: 'Jade Super League', cupName: 'Dragon Cup' },
  { id: 'south_korea', name: 'South Korea', demonym: 'South Korean', climate: 'temperate', continent: 'asia', strength: 75, leagueName: 'Taeguk League', cupName: 'Hangang Cup' },
  { id: 'palestine', name: 'Palestine', demonym: 'Palestinian', climate: 'hot', continent: 'asia', strength: 62, leagueName: 'Olive League', cupName: 'Jasmine Cup' },
  { id: 'mexico', name: 'Mexico', demonym: 'Mexican', climate: 'hot', continent: 'americas', strength: 77, leagueName: 'Liga Azteca', cupName: 'Copa Águila' },
];

export const NATION_BY_ID: Record<NationId, Nation> = Object.fromEntries(
  NATIONS.map((n) => [n.id, n]),
) as Record<NationId, Nation>;

interface NamePools {
  first: string[];
  last: string[];
  cityStems: string[];        // 12 fictional city/locale stems per nation
  clubPatterns: [string, string]; // two patterns; {c} = city stem
}

export const NAME_POOLS: Record<NationId, NamePools> = {
  brazil: {
    first: ['Thiago', 'Rafael', 'Gustavo', 'João', 'Matheus', 'Lucas', 'Pedro', 'Caio', 'Vinícius', 'Bruno', 'Everton', 'Diego'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Carvalho', 'Almeida', 'Nascimento', 'Moraes', 'Barbosa', 'Teixeira', 'Ribeiro', 'Farias'],
    cityStems: ['Vila Aurora', 'Porto Verde', 'Santa Clara', 'Rio Dourado', 'Cruzalta', 'Mar Azul', 'Serra Alta', 'Palmeirinha', 'Novo Horizonte', 'Baía Grande', 'Campo Real', 'Litoral'],
    clubPatterns: ['{c} FC', 'SC {c}'],
  },
  argentina: {
    first: ['Santiago', 'Mateo', 'Joaquín', 'Facundo', 'Nicolás', 'Agustín', 'Tomás', 'Lautaro', 'Franco', 'Ignacio', 'Emiliano', 'Gonzalo'],
    last: ['Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Gómez', 'Díaz', 'Herrera', 'Acosta', 'Medina', 'Suárez', 'Rojas', 'Molina', 'Castro'],
    cityStems: ['Villa Estrella', 'Puerto Bravo', 'San Telmo Sur', 'Río Claro', 'La Pampa Alta', 'El Mirador', 'Costa Plata', 'Cerro Azul', 'Las Lomas', 'Nueva Esperanza', 'Del Valle', 'La Ribera'],
    clubPatterns: ['CA {c}', 'Club {c}'],
  },
  spain: {
    first: ['Álvaro', 'Iker', 'Sergio', 'Pablo', 'Marcos', 'Adrián', 'Rubén', 'Javier', 'Hugo', 'Mario', 'Dani', 'Unai'],
    last: ['García', 'Torres', 'Navarro', 'Serrano', 'Ortega', 'Vidal', 'Moreno', 'Iglesias', 'Delgado', 'Campos', 'Vega', 'Prieto', 'Fuentes', 'Aguilar'],
    cityStems: ['Monteluz', 'Villaflor', 'Peñablanca', 'Costa Serena', 'Alcorán', 'Riofrío', 'San Marcial', 'Torrevieja Alta', 'Valdemar', 'Cabo Norte', 'Piedralta', 'Lagunilla'],
    clubPatterns: ['Real {c}', '{c} CF'],
  },
  france: {
    first: ['Lucas', 'Hugo', 'Théo', 'Antoine', 'Maxime', 'Julien', 'Romain', 'Nathan', 'Clément', 'Baptiste', 'Loïc', 'Mathis'],
    last: ['Bernard', 'Dubois', 'Moreau', 'Laurent', 'Lefèvre', 'Roux', 'Fournier', 'Girard', 'Lambert', 'Mercier', 'Blanc', 'Chevalier', 'Perrin', 'Marchand'],
    cityStems: ['Montreval', 'Saint-Aubin', 'Villeneuve-Nord', 'Clairefonds', 'Beaulac', 'Port-Céleste', 'Rocheval', 'Aubermont', 'Val-de-Brume', 'Lachapelle', 'Coteaux', 'Rivedoux'],
    clubPatterns: ['{c} FC', 'AS {c}'],
  },
  morocco: {
    first: ['Youssef', 'Amine', 'Omar', 'Hamza', 'Mehdi', 'Anas', 'Ayoub', 'Zakaria', 'Ilyas', 'Karim', 'Reda', 'Soufiane'],
    last: ['El Amrani', 'Benali', 'Chakiri', 'Idrissi', 'El Fassi', 'Bouazza', 'Tahiri', 'Lahlou', 'Ziani', 'El Khattabi', 'Sabri', 'Mansouri', 'Berrada', 'Ouali'],
    cityStems: ['Bab Noor', 'Dar Salam', 'Aïn Zohra', 'Ksar Jadid', 'Ras Bahr', 'Jbel Atlas', 'Oued Fida', 'Medina Kbira', 'Tanjah Sud', 'Sahel Rif', 'Qasba', 'Marsa Zitoun'],
    clubPatterns: ['Raja {c}', '{c} AC'],
  },
  south_africa: {
    first: ['Sipho', 'Thabo', 'Lwazi', 'Kagiso', 'Bongani', 'Mandla', 'Tebogo', 'Sibusiso', 'Katlego', 'Neo', 'Andile', 'Lucky'],
    last: ['Nkosi', 'Dlamini', 'Mokoena', 'Khumalo', 'Ndlovu', 'Mahlangu', 'Zwane', 'Sithole', 'Modise', 'Maseko', 'Radebe', 'Tshabalala', 'Molefe', 'Buthelezi'],
    cityStems: ['Golden Reef', 'Umzansi Bay', 'Highveld Park', 'Karoo Springs', 'Table View', 'Marula Grove', 'Eland Ridge', 'Amanzi', 'Silver Lake', 'Protea Heights', 'Kalahari Gate', 'Umoya'],
    clubPatterns: ['{c} United', '{c} Pirates'],
  },
  nigeria: {
    first: ['Chinedu', 'Emeka', 'Ifeanyi', 'Tunde', 'Segun', 'Kelechi', 'Obinna', 'Uche', 'Femi', 'Chukwudi', 'Sani', 'Musa'],
    last: ['Okafor', 'Adeyemi', 'Balogun', 'Eze', 'Okonkwo', 'Adebayo', 'Nwachukwu', 'Ibrahim', 'Olawale', 'Chukwu', 'Abubakar', 'Ogunleye', 'Danladi', 'Umeh'],
    cityStems: ['Sunrise City', 'Green Delta', 'Savannah Hill', 'Iron Gate', 'Palm Coast', 'River Bend', 'Eagle Rock', 'New Lagoon', 'Kola Heights', 'Harmattan', 'Golden Yam', 'Unity Town'],
    clubPatterns: ['{c} FC', '{c} Rangers'],
  },
  japan: {
    first: ['Haruto', 'Yuto', 'Sota', 'Ren', 'Kaito', 'Riku', 'Daiki', 'Takumi', 'Shota', 'Kenta', 'Hiroto', 'Yuma'],
    last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto'],
    cityStems: ['Aozora', 'Hikarigawa', 'Minato Kita', 'Sakuradai', 'Yamabuki', 'Kawashiro', 'Hoshimura', 'Takamori', 'Umikaze', 'Fujinooka', 'Kagerou', 'Shinmachi'],
    clubPatterns: ['{c} SC', '{c} Eleven'],
  },
  china: {
    first: ['Wei', 'Jun', 'Hao', 'Lei', 'Ming', 'Feng', 'Tao', 'Bo', 'Chen', 'Kai', 'Long', 'Yang'],
    last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Huang', 'Zhou', 'Wu', 'Xu', 'Sun', 'Ma', 'Zhu'],
    cityStems: ['Jinhe', 'Yunshan', 'Baihu', 'Longwan', 'Xinggang', 'Tianhu', 'Shuangqiao', 'Hongye', 'Qingfeng', 'Haibin', 'Yuelin', 'Guangming'],
    clubPatterns: ['{c} FC', '{c} Dragons'],
  },
  south_korea: {
    first: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ji-ho', 'Ha-jun', 'Jun-seo', 'Woo-jin', 'Sung-min', 'Tae-yang', 'Hyun-woo', 'Ji-hun', 'Kang-min'],
    last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Shin', 'Oh', 'Seo'],
    cityStems: ['Haneul', 'Baekho', 'Namsan Peak', 'Dongbaek', 'Cheongna', 'Bitgaram', 'Saebyeok', 'Hallyeo', 'Geumgang', 'Arae', 'Byeolbit', 'Mirinae'],
    clubPatterns: ['{c} FC', '{c} Tigers'],
  },
  palestine: {
    first: ['Mohammed', 'Ahmad', 'Mahmoud', 'Khaled', 'Tariq', 'Sami', 'Nabil', 'Yousef', 'Rami', 'Bashar', 'Fadi', 'Hani'],
    last: ['Khalil', 'Mansour', 'Haddad', 'Awad', 'Salameh', 'Nasser', 'Odeh', 'Barghouti', 'Hamdan', 'Saleh', 'Zaidan', 'Qasem', 'Faraj', 'Shaheen'],
    cityStems: ['Zaytoun', 'Bab Shams', 'Wadi Ward', 'Tal Rihan', 'Marj Akhdar', 'Ain Yasmin', 'Burj Amal', 'Sahel Bahr', 'Rumman', 'Qamar', 'Jabal Noor', 'Dar Zahra'],
    clubPatterns: ['{c} SC', 'Shabab {c}'],
  },
  mexico: {
    first: ['Diego', 'Alejandro', 'Emiliano', 'Luis', 'Andrés', 'Ricardo', 'Fernando', 'Javier', 'Carlos', 'Miguel', 'Raúl', 'Óscar'],
    last: ['Hernández', 'Ramírez', 'Cruz', 'Flores', 'Vázquez', 'Jiménez', 'Morales', 'Reyes', 'Gutiérrez', 'Chávez', 'Ríos', 'Mendoza', 'Salazar', 'Cortés'],
    cityStems: ['Valle Rojo', 'Cerro Plata', 'Costa Bravía', 'Nopalera', 'Lago Azul', 'Sierra Vista', 'El Faro', 'Piedras Altas', 'Agua Clara', 'Monte Sol', 'La Cantera', 'Bahía Perla'],
    clubPatterns: ['Club {c}', 'Deportivo {c}'],
  },
};

/** Faith/family texture per nation (individual-keyed at generation; not stereotype). */
export const NATION_TEXTURE: Record<NationId, { faiths: Array<'muslim' | 'christian' | 'none' | 'other'>; familyExpectationHighOdds: number }> = {
  brazil: { faiths: ['christian', 'christian', 'none'], familyExpectationHighOdds: 0.5 },
  argentina: { faiths: ['christian', 'none'], familyExpectationHighOdds: 0.35 },
  spain: { faiths: ['christian', 'none', 'none'], familyExpectationHighOdds: 0.25 },
  france: { faiths: ['none', 'christian', 'muslim'], familyExpectationHighOdds: 0.3 },
  morocco: { faiths: ['muslim', 'muslim', 'muslim', 'none'], familyExpectationHighOdds: 0.7 },
  south_africa: { faiths: ['christian', 'christian', 'none', 'other'], familyExpectationHighOdds: 0.6 },
  nigeria: { faiths: ['christian', 'muslim', 'christian'], familyExpectationHighOdds: 0.75 },
  japan: { faiths: ['none', 'other', 'none'], familyExpectationHighOdds: 0.3 },
  china: { faiths: ['none', 'none', 'other'], familyExpectationHighOdds: 0.55 },
  south_korea: { faiths: ['none', 'christian', 'other'], familyExpectationHighOdds: 0.4 },
  palestine: { faiths: ['muslim', 'muslim', 'christian'], familyExpectationHighOdds: 0.7 },
  mexico: { faiths: ['christian', 'christian', 'none'], familyExpectationHighOdds: 0.6 },
};
