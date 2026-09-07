// Mapping of English / Alternative Thai Province names to Official Thai Province Names
const PROVINCE_MAP = {
  // Central & Bangkok
  'bangkok': 'กรุงเทพมหานคร',
  'bkk': 'กรุงเทพมหานคร',
  'krung thep': 'กรุงเทพมหานคร',
  'krung thep maha nakhon': 'กรุงเทพมหานคร',
  'krungthep': 'กรุงเทพมหานคร',
  'samut prakan': 'สมุทรปราการ',
  'samutprakarn': 'สมุทรปราการ',
  'samutprakan': 'สมุทรปราการ',
  'nonthaburi': 'นนทบุรี',
  'pathum thani': 'ปทุมธานี',
  'pathumthani': 'ปทุมธานี',
  'phra nakhon si ayutthaya': 'พระนครศรีอยุธยา',
  'ayutthaya': 'พระนครศรีอยุธยา',
  'ayuthaya': 'พระนครศรีอยุธยา',
  'ang thong': 'อ่างทอง',
  'angthong': 'อ่างทอง',
  'lopburi': 'ลพบุรี',
  'lop buri': 'ลพบุรี',
  'sing buri': 'สิงห์บุรี',
  'singburi': 'สิงห์บุรี',
  'chai nat': 'ชัยนาท',
  'chainat': 'ชัยนาท',
  'saraburi': 'สระบุรี',
  'nakhon nayok': 'นครนายก',
  'nakhonnayok': 'นครนายก',
  'nakhon pathom': 'นครปฐม',
  'nakhonpathom': 'นครปฐม',
  'samut sakhon': 'สมุทรสาคร',
  'samutsakhon': 'สมุทรสาคร',
  'samut songkhram': 'สมุทรสงคราม',
  'samutsongkhram': 'สมุทรสงคราม',
  'suphan buri': 'สุพรรณบุรี',
  'suphanburi': 'สุพรรณบุรี',

  // East
  'chon buri': 'ชลบุรี',
  'chonburi': 'ชลบุรี',
  'rayong': 'ระยอง',
  'chanthaburi': 'จันทบุรี',
  'chantaburi': 'จันทบุรี',
  'trat': 'ตราด',
  'chachoengsao': 'ฉะเชิงเทรา',
  'prachin buri': 'ปราจีนบุรี',
  'prachinburi': 'ปราจีนบุรี',
  'sa kaeo': 'สระแก้ว',
  'sakaeo': 'สระแก้ว',

  // North
  'chiang mai': 'เชียงใหม่',
  'chiangmai': 'เชียงใหม่',
  'lamphun': 'ลำพูน',
  'lampang': 'ลำปาง',
  'uttaradit': 'อุตรดิตถ์',
  'phrae': 'แพร่',
  'nan': 'น่าน',
  'phayao': 'พะเยา',
  'chiang rai': 'เชียงราย',
  'chiangrai': 'เชียงราย',
  'mae hong son': 'แม่ฮ่องสอน',
  'maehongson': 'แม่ฮ่องสอน',
  'nakhon sawan': 'นครสวรรค์',
  'nakhonsawan': 'นครสวรรค์',
  'uthai thani': 'อุทัยธานี',
  'uthaithani': 'อุทัยธานี',
  'kamphaeng phet': 'กำแพงเพชร',
  'kamphaengphet': 'กำแพงเพชร',
  'tak': 'ตาก',
  'sukhothai': 'สุโขทัย',
  'phitsanulok': 'พิษณุโลก',
  'phichit': 'พิจิตร',
  'phetchabun': 'เพชรบูรณ์',
  'petchabun': 'เพชรบูรณ์',

  // Northeast (Isan)
  'nakhon ratchasima': 'นครราชสีมา',
  'nakhonratchasima': 'นครราชสีมา',
  'korat': 'นครราชสีมา',
  'buri ram': 'บุรีรัมย์',
  'buriram': 'บุรีรัมย์',
  'surin': 'สุรินทร์',
  'si sa ket': 'ศรีสะเกษ',
  'sisaket': 'ศรีสะเกษ',
  'ubon ratchathani': 'อุบลราชธานี',
  'ubonratchathani': 'อุบลราชธานี',
  'ubon': 'อุบลราชธานี',
  'yasothon': 'ยโสธร',
  'chaiyaphum': 'ชัยภูมิ',
  'amnat charoen': 'อำนาจเจริญ',
  'amnatcharoen': 'อำนาจเจริญ',
  'nong bua lam phu': 'หนองบัวลำภู',
  'nongbualamphu': 'หนองบัวลำภู',
  'khon kaen': 'ขอนแก่น',
  'khonkaen': 'ขอนแก่น',
  'udon thani': 'อุดรธานี',
  'udonthani': 'อุดรธานี',
  'udon': 'อุดรธานี',
  'loei': 'เลย',
  'nong khai': 'หนองคาย',
  'nongkhai': 'หนองคาย',
  'maha sarakham': 'มหาสารคาม',
  'mahasarakham': 'มหาสารคาม',
  'roi et': 'ร้อยเอ็ด',
  'roiet': 'ร้อยเอ็ด',
  'kalasin': 'กาฬสินธุ์',
  'sakon nakhon': 'สกลนคร',
  'sakonnakhon': 'สกลนคร',
  'nakhon phanom': 'นครพนม',
  'nakhonphanom': 'นครพนม',
  'mukdahan': 'มุกดาหาร',
  'bueng kan': 'บึงกาฬ',
  'buengkan': 'บึงกาฬ',

  // West & South
  'ratchaburi': 'ราชบุรี',
  'ratburi': 'ราชบุรี',
  'kanchanaburi': 'กาญจนบุรี',
  'phetchaburi': 'เพชรบุรี',
  'petchaburi': 'เพชรบุรี',
  'prachuap khiri khan': 'ประจวบคีรีขันธ์',
  'prachuap': 'ประจวบคีรีขันธ์',
  'chumphon': 'ชุมพร',
  'ranong': 'ระนอง',
  'surat thani': 'สุราษฎร์ธานี',
  'suratthani': 'สุราษฎร์ธานี',
  'surat': 'สุราษฎร์ธานี',
  'phang nga': 'พังงา',
  'phangnga': 'พังงา',
  'phuket': 'ภูเก็ต',
  'krabi': 'กระบี่',
  'nakhon si thammarat': 'นครศรีธรรมราช',
  'nakhonsithammarat': 'นครศรีธรรมราช',
  'trang': 'ตรัง',
  'phatthalung': 'พัทลุง',
  'satun': 'สตูล',
  'songkhla': 'สงขลา',
  'pattani': 'ปัตตานี',
  'yala': 'ยะลา',
  'narathiwat': 'นราธิวาส'
};

/**
 * Normalizes and converts an English or alternative province name to official Thai.
 * If already in Thai or unknown, formats and returns appropriately.
 */
export function toThaiProvince(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  const normalizedKey = trimmed.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

  if (PROVINCE_MAP[normalizedKey]) {
    return PROVINCE_MAP[normalizedKey];
  }

  // Check without spaces
  const noSpacesKey = normalizedKey.replace(/\s/g, '');
  if (PROVINCE_MAP[noSpacesKey]) {
    return PROVINCE_MAP[noSpacesKey];
  }

  // If not found in map, return capitalized original string or original input
  return trimmed;
}
