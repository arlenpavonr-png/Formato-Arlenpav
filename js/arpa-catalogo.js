/**
 * Catálogo compartido: marcas Accessmatic, BFT, Elite, NAS.
 * Usado por Formato/Instalación (select en cascada) y Cotización (buscador).
 */
(function (global) {
  const CATALOGO_MARCAS = {
    Accessmatic: {
      'Levadiza / Seccional': [
        { cod: 'AUACSC901', nom: 'Scorpion 901 – ½ HP' },
        { cod: 'AUACFX1000', nom: 'Fox 1000 Pro – ¾ HP' },
        { cod: 'AUACKFOX1000C', nom: 'Fox 1000 Pro + Riel C correa' },
        { cod: 'AUACKFOX1000T', nom: 'Fox 1000 Pro + Riel T metálico' },
        { cod: 'AUACFX1100WS', nom: 'Fox 1100 Pro WiFi – ¾ HP' },
        { cod: 'AUACKFOX1050HS', nom: 'Fox 1050 High Speed – ¾ HP' },
        { cod: 'AUACKFOX1100WS', nom: 'Fox 1100 Pro WiFi + Riel T' },
        { cod: 'AUACSH1000', nom: 'Shark 1000 – ¾ HP silencioso' },
        { cod: 'AUACRP120', nom: 'Raptor 1200 – 1 HP' },
        { cod: 'AUACPUMA1200', nom: 'Puma 1200 WiFi – 1 HP' },
        { cod: 'AUACKSC1800C', nom: 'Scorpion 1800 – 1.5 HP Riel C' },
        { cod: 'AUACKSC1800T', nom: 'Scorpion 1800 – 1.5 HP Riel T' },
      ],
      Corrediza: [
        { cod: 'AUACKPB400', nom: 'Pitbull 400 – 400 kg' },
        { cod: 'AUACKBD850', nom: 'Bulldozer 850 – 850 kg' },
        { cod: 'AUACKBD1100', nom: 'Bulldog 1100 – 1100 kg' },
        { cod: 'AUACKBD1024BL', nom: 'Bulldog 1024BL – 1000 kg sin escobillas' },
        { cod: 'AUACKBD1522', nom: 'Bulldog 1522 – 1500 kg 220V industrial' },
        { cod: 'AUACKBD1824BL', nom: 'Bulldog 1824BL – 1800 kg sin escobillas' },
        { cod: 'AUACKBD2024', nom: 'Bulldog 2024 – 2000 kg industrial' },
      ],
      'Batiente 2 hojas': [
        { cod: 'AUACEG250', nom: 'Eagle 250 – 2 hojas / 250 kg / 3 m' },
        { cod: 'AUACFC300', nom: 'Falcon 300 – 2 hojas / 300 kg/hoja / 3 m' },
        { cod: 'AUACFC350', nom: 'Falcon 350 – 2 hojas / 350 kg / 4 m' },
        { cod: 'AUACEG500', nom: 'Eagle 500 – 2 hojas / 350 kg / 5 m' },
        { cod: 'AUACFENIX600', nom: 'Fénix 600 – 2 hojas / 600 kg / 5.5 m' },
      ],
      'Batiente 1 hoja': [
        { cod: 'AUACFC351', nom: 'Falcon 351 – 1 hoja / 350 kg / 4 m' },
        { cod: 'AUACEG501', nom: 'Eagle 501 – 1 hoja / 350 kg / 5 m' },
        { cod: 'AUACFENIX601', nom: 'Fénix 601 – 1 hoja / 600 kg / 5.5 m' },
      ],
      'Cortina enrollable': [
        { cod: 'AUACKAR201B', nom: 'Armadillo 200 (sin control) – 200 kg' },
        { cod: 'AUACKAR382B', nom: 'Armadillo 380 (sin control) – 380 kg' },
        { cod: 'AUACKAR201F', nom: 'Armadillo 200 (con control) – 200 kg' },
        { cod: 'AUACKAR382F', nom: 'Armadillo 380 (con control) – 380 kg' },
        { cod: 'AUACKHULK500S', nom: 'Hulk 500S – 500 kg industrial' },
        { cod: 'AUACKHULK624DC', nom: 'Hulk 624DC – 600 kg con batería' },
        { cod: 'AUACKHULK750', nom: 'Hulk 750 – 750 kg' },
        { cod: 'AUACKHULK950', nom: 'Hulk 950 – 950 kg' },
        { cod: 'AUACKHULK1024DC', nom: 'Hulk 1024DC – 1000 kg con batería' },
        { cod: 'AUACKHULK1500', nom: 'Hulk 1500 – 1500 kg 220V' },
      ],
      'Barrera vehicular': [
        { cod: 'AUACMTD224', nom: 'Mastodon 224 – 220V / asta 2 m' },
        { cod: 'AUCKMTD224', nom: 'Kit Mastodon 224 + asta 2 m' },
        { cod: 'AUACMTD624', nom: 'Mastodon 624 – alta velocidad 110/220V' },
        { cod: 'AUACKMTD624', nom: 'Kit Mastodon 624 + asta telescópica 3-6 m' },
        { cod: 'AUACKMTD624ART', nom: 'Kit Mastodon 624 + asta articulada 4 m' },
      ],
    },
    BFT: {
      Corrediza: [
        { cod: 'KDEIMOSBTA400-1', nom: 'Deimos BT A400 – Corredizo 400kg 110V (Kit)', pvp: 1948900 },
        { cod: 'KDEIMOSBTA600-1', nom: 'Deimos BT A600 – Corredizo 600kg 110V (Kit)', pvp: 2391900 },
        { cod: 'KDEIMOSACA600-1', nom: 'Deimos AC A600 – Corredizo 600kg 110V (Kit)', pvp: 2960900 },
        { cod: 'KDEIMOSACA600-2', nom: 'Deimos AC A600 – Corredizo 600kg 220V (Kit)', pvp: 2960900 },
        { cod: 'KDEIMOSACA800SLDN-1', nom: 'Deimos AC A800 SL DN – Corredizo 800kg 110V (Kit)', pvp: 3728900 },
        { cod: 'KDEIMOSACA800SLDN-2', nom: 'Deimos AC A800 SL DN – Corredizo 800kg 220V (Kit)', pvp: 3728900 },
        { cod: 'KARESBTA1000Z18-2', nom: 'Ares BTA 1000 – Corredizo 1000kg 220V Piñón 18 (Kit)', pvp: 3539900 },
        { cod: 'KARESBTA1000Z25-2', nom: 'Ares BTA 1000 – Corredizo 500kg 220V Piñón 25 (Kit)', pvp: 3539000 },
        { cod: 'KARESBTA1500Z18-2', nom: 'Ares BTA 1500 – Corredizo 1500kg 220V Piñón 18 (Kit)', pvp: 4209900 },
        { cod: 'KARESBTA1500Z25-2', nom: 'Ares BTA 1500 – Corredizo 750kg 220V Piñón 25 (Kit)', pvp: 4402900 },
        { cod: 'KICAROSMARTACA2000V', nom: 'Icaro Smart AC A2000 – Corredizo 1000kg 220V (Kit)', pvp: 5522900 },
        { cod: 'KICAROSMARTACA2000', nom: 'Icaro Smart AC A2000 – Corredizo 2000kg uso continuo (Kit)', pvp: 5522900 },
      ],
      'Batiente 1 hoja': [
        { cod: 'K1PHOBOBTA25-1', nom: 'Phobos BT A25 – Batiente 400kg 2.5m 110V (Kit 1 brazo)', pvp: 2663900 },
        { cod: 'K1PHOBOBTA40-1', nom: 'Phobos BT A40 – Batiente 500kg 4m 110V (Kit 1 brazo)', pvp: 2995900 },
        { cod: 'K1PHOBOSACA25-AL', nom: 'Phobos AC A25 – Batiente 400kg 2.5m tarjeta Alena (Kit 1 brazo)', pvp: 2844900 },
        { cod: 'K1PHOBOSACA25-R', nom: 'Phobos AC A25 – Batiente 400kg 2.5m tarjeta Rigel (Kit 1 brazo)', pvp: 3170900 },
        { cod: 'K1LUX2B-1', nom: 'Lux 2B Hidráulico – Batiente 300kg 3.5m (Kit 1 brazo)', pvp: 3875900 },
        { cod: 'K1LUXGV2B-1', nom: 'Lux GV 2B Hidráulico – Batiente 300kg 3.5m (Kit 1 brazo)', pvp: 4923900 },
        { cod: 'K1GIUNO-BTA20-1', nom: 'Giuno Ultra BT A20 Hidráulico – Batiente 300kg 2.5m uso continuo (Kit 1 brazo)', pvp: 6096900 },
        { cod: 'K1GIUNO-BTA50-1', nom: 'Giuno Ultra BT A50 Hidráulico – Batiente 800kg 5m uso intensivo (Kit 1 brazo)', pvp: 7024900 },
      ],
      'Batiente 2 hojas': [
        { cod: 'KPHOBOBTA25-1', nom: 'Phobos BT A25 – Batiente 400kg 2.5m 110V (Kit 2 brazos)', pvp: 3278900 },
        { cod: 'KPHOBOBTA40-1', nom: 'Phobos BT A40 – Batiente 500kg 4m 110V (Kit 2 brazos)', pvp: 3498900 },
        { cod: 'K2PHOBOSACA25-AL', nom: 'Phobos AC A25 – Batiente 400kg 2.5m tarjeta Alena (Kit 2 brazos)', pvp: 3253900 },
        { cod: 'K2PHOBOSACA25-R', nom: 'Phobos AC A25 – Batiente 400kg 2.5m tarjeta Rigel (Kit 2 brazos)', pvp: 3823900 },
        { cod: 'K2LUX2B-1', nom: 'Lux 2B Hidráulico – Batiente 300kg 3.5m (Kit 2 brazos)', pvp: 6413900 },
        { cod: 'K2LUXGV2B-1', nom: 'Lux GV 2B Hidráulico – Batiente 300kg 3.5m (Kit 2 brazos)', pvp: 8407900 },
        { cod: 'K2GIUNO-BTA20-1', nom: 'Giuno Ultra BT A20 Hidráulico – Batiente 300kg 2.5m uso continuo (Kit 2 brazos)', pvp: 9709900 },
        { cod: 'K2GIUNO-BTA50-1', nom: 'Giuno Ultra BT A50 Hidráulico – Batiente 800kg 5m uso intensivo (Kit 2 brazos)', pvp: 10394900 },
      ],
      'Barrera vehicular': [
        { cod: 'KMOOVI30', nom: 'Moovi 30 – Barrera 3m 220V apertura 4seg (Kit)', pvp: 5383900 },
        { cod: 'KMOOVI60', nom: 'Moovi 60 – Barrera 6m 220V apertura 8.5seg (Kit)', pvp: 6587900 },
        { cod: 'KGIOTTOBTA30U', nom: 'Giotto BT A30 – Barrera 3m 220V/24V uso muy intensivo (Kit)', pvp: 6670900 },
        { cod: 'KGIOTTOBTA60U', nom: 'Giotto BT A60 – Barrera 6m 220V/24V uso muy intensivo (Kit)', pvp: 7862900 },
        { cod: 'KMICHELANGELO30', nom: 'Michelangelo – Barrera 3m 220V apertura 1.3seg (Kit)', pvp: 12890900 },
      ],
      Accesorios: [
        { cod: 'D112306', nom: 'Control Remoto Mitto Cool C2 – 2 canales 433MHz', pvp: 89000 },
        { cod: 'D112318', nom: 'Control Remoto Mitto Cool C4 – 4 canales 433MHz', pvp: 124000 },
        { cod: 'KCMC-10', nom: 'Caja x10 Controles Mitto Cool C2', pvp: 740000 },
        { cod: 'P111526', nom: 'Par Fotoceldas Desme A15 Exterior 30m 24V', pvp: 251000 },
        { cod: 'P111827', nom: 'Fotoceldas Reflecta Reflexión Exterior 12m 24V', pvp: 705000 },
      ],
    },
    NAS: {
      'Levadiza / Seccional': [
        { cod: 'KPOWER700', nom: 'KPower 700 – motor de garaje residencial' },
        { cod: 'KPOWER1000', nom: 'KPower 1000 – motor de garaje residencial' },
        { cod: 'KPOWER1200', nom: 'KPower 1200 – motor de garaje residencial' },
      ],
      Corrediza: [
        { cod: 'FORZA500', nom: 'Forza 500 – 500 kg corrediza' },
        { cod: 'FORZA800', nom: 'Forza 800 – 800 kg corrediza' },
        { cod: 'FORTE800', nom: 'Forte 800 – 800 kg corrediza' },
        { cod: 'FORTE1200', nom: 'Forte 1200 – 1200 kg corrediza' },
        { cod: 'FORTE1500', nom: 'Forte 1500 – 1500 kg corrediza' },
        { cod: 'FORTE800DC', nom: 'Forte 800DC – 800 kg con batería' },
        { cod: 'FORTE800+', nom: 'Forte 800+ – 800 kg corrediza' },
      ],
      'Batiente 1 hoja': [
        { cod: 'APOLO200-1', nom: 'Apolo 200 – 1 hoja batiente' },
        { cod: 'APOLO300-1', nom: 'Apolo 300 – 1 hoja batiente' },
        { cod: 'MAGNO200-1', nom: 'Magno 200 – 1 hoja batiente' },
        { cod: 'POTENZA400-1', nom: 'Potenza 400 – 1 hoja batiente' },
      ],
      'Batiente 2 hojas': [
        { cod: 'APOLO200', nom: 'Apolo 200 – 2 hojas batientes' },
        { cod: 'APOLO300', nom: 'Apolo 300 – 2 hojas batientes' },
        { cod: 'MAGNO200', nom: 'Magno 200 – 2 hojas batientes' },
        { cod: 'POTENZA400', nom: 'Potenza 400 – 2 hojas batientes' },
      ],
      'Barrera vehicular': [
        { cod: 'ELECTRA-DC421', nom: 'Electra DC421 – barrera electromecánica' },
        { cod: 'ELECTRA-DC656', nom: 'Electra DC656 – barrera electromecánica' },
      ],
      'Cortina enrollable': [
        { cod: 'THOR', nom: 'Thor – uso industrial externo' },
        { cod: 'ODIN', nom: 'Odin – uso industrial externo' },
        { cod: 'HERCULES', nom: 'Hércules – uso interno' },
      ],
    },
    Elite: {
      'Levadiza / Seccional': [
        { cod: 'AUELMG750', nom: 'Elite MG 750 – ½ HP silencioso' },
      ],
      Corrediza: [
        { cod: 'AUELMC4', nom: 'Elite Slide 400 – 400 kg' },
        { cod: 'AUELMC5', nom: 'Elite Slide 500 – 500 kg' },
        { cod: 'AUELMC8', nom: 'Elite Slide 800 – 800 kg' },
        { cod: 'AUELMC8FV', nom: 'Elite Slide 800 FV – 800 kg con lámpara' },
        { cod: 'AUELMC12', nom: 'Elite Slide 1200 – 1200 kg industrial' },
      ],
      'Batiente 2 hojas': [
        { cod: 'AUELTW25', nom: 'Elite Twist 250 – 2 hojas / 250 kg' },
      ],
      'Cortina enrollable': [
        { cod: 'AUELKME611', nom: 'Elite ME622 – 600 kg 110V' },
        { cod: 'AUELKME624DC', nom: 'Elite Spin 624DC – 600 kg 24V con batería' },
        { cod: 'AUELKME8511', nom: 'Elite Spin ME8511 – 800 kg 110V' },
        { cod: 'AUELKME824DC', nom: 'Elite Spin ME824DC – 800 kg con batería' },
      ],
    },
  };

  /** Precios de venta (PVP) por código — misma fuente para Cotización */
  const PRECIOS_PVP = {
    AUACSC901: 999900,
    AUACFX1000: 799900,
    AUACKFOX1000C: 1049900,
    AUACKFOX1000T: 1149900,
    AUACFX1100WS: 1119900,
    AUACKFOX1050HS: 1219900,
    AUACKFOX1100WS: 1399900,
    AUACSH1000: 1095900,
    AUACRP120: 1399900,
    AUACPUMA1200: 1369900,
    AUACKSC1800C: 1999900,
    AUACKSC1800T: 1999900,
    AUACKPB400: 1099900,
    AUACKBD850: 1599900,
    AUACKBD1100: 1999900,
    AUACKBD1024BL: 3399900,
    AUACKBD1522: 2629900,
    AUACKBD1824BL: 3999900,
    AUACKBD2024: 3599900,
    AUACEG250: 2519900,
    AUACFC300: 2199900,
    AUACFC350: 3749900,
    AUACEG500: 3889900,
    AUACFENIX600: 6719900,
    AUACFC351: 2719900,
    AUACEG501: 2729900,
    AUACFENIX601: 4159900,
    AUACKAR201B: 1249900,
    AUACKAR382B: 1699900,
    AUACKAR201F: 1349900,
    AUACKAR382F: 1889900,
    AUACKHULK500S: 1399900,
    AUACKHULK624DC: 1729900,
    AUACKHULK750: 1999900,
    AUACKHULK950: 2249900,
    AUACKHULK1024DC: 2699900,
    AUACKHULK1500: 4249900,
    AUACMTD224: 2999900,
    AUCKMTD224: 3499900,
    AUACMTD624: 4599900,
    AUACKMTD624: 5399900,
    AUACKMTD624ART: 6199900,
    AUELMG750: 939900,
    AUELMC4: 1069900,
    AUELMC5: 1199900,
    AUELMC8: 1549900,
    AUELMC8FV: 1899900,
    AUELMC12: 1999900,
    AUELTW25: 1799900,
    AUELKME611: 1169900,
    AUELKME624DC: 1649900,
    AUELKME8511: 1759900,
    AUELKME824DC: 2469900,
    'KDEIMOSBTA400-1': 1948900,
    'KDEIMOSBTA600-1': 2391900,
    'KDEIMOSACA600-1': 2960900,
    'KDEIMOSACA600-2': 2960900,
    'KDEIMOSACA800SLDN-1': 3728900,
    'KDEIMOSACA800SLDN-2': 3728900,
    'KARESBTA1000Z18-2': 3539900,
    'KARESBTA1000Z25-2': 3539000,
    'KARESBTA1500Z18-2': 4209900,
    'KARESBTA1500Z25-2': 4402900,
    KICAROSMARTACA2000V: 5522900,
    KICAROSMARTACA2000: 5522900,
    'KPHOBOBTA25-1': 3278900,
    'KPHOBOBTA40-1': 3498900,
    'K1PHOBOBTA25-1': 2663900,
    'K1PHOBOBTA40-1': 2995900,
    'K2PHOBOSACA25-AL': 3253900,
    'K2PHOBOSACA25-R': 3823900,
    'K1PHOBOSACA25-AL': 2844900,
    'K1PHOBOSACA25-R': 3170900,
    'K2LUX2B-1': 6413900,
    'K1LUX2B-1': 3875900,
    'K2LUXGV2B-1': 8407900,
    'K1LUXGV2B-1': 4923900,
    'K2GIUNO-BTA20-1': 9709900,
    'K1GIUNO-BTA20-1': 6096900,
    'K2GIUNO-BTA50-1': 10394900,
    'K1GIUNO-BTA50-1': 7024900,
    KMOOVI30: 5383900,
    KMOOVI60: 6587900,
    KGIOTTOBTA30U: 6670900,
    KGIOTTOBTA60U: 7862900,
    KMICHELANGELO30: 12890900,
    D112306: 89000,
    D112318: 124000,
    'KCMC-10': 740000,
    P111526: 251000,
    P111827: 705000,
    KPOWER700: 939900,
    KPOWER1000: 999900,
    KPOWER1200: 1095900,
    FORZA500: 1199900,
    FORZA800: 1549900,
    FORTE800: 1549900,
    FORTE1200: 1999900,
    FORTE1500: 2629900,
    FORTE800DC: 1649900,
    'FORTE800+': 1699900,
    'APOLO200-1': 1799900,
    'APOLO300-1': 2199900,
    'MAGNO200-1': 2519900,
    'POTENZA400-1': 2719900,
    APOLO200: 2519900,
    APOLO300: 3889900,
    MAGNO200: 2719900,
    POTENZA400: 4159900,
    'ELECTRA-DC421': 4599900,
    'ELECTRA-DC656': 5399900,
    THOR: 4249900,
    ODIN: 3999900,
    HERCULES: 2699900,
  };

  function enrichCatalogoPrecios() {
    Object.values(CATALOGO_MARCAS).forEach((categorias) => {
      Object.values(categorias).forEach((items) => {
        items.forEach((item) => {
          if (item.pvp == null || item.pvp === 0) {
            item.pvp = PRECIOS_PVP[item.cod] || 0;
          }
        });
      });
    });
  }

  enrichCatalogoPrecios();

  let listaPlanaCache = null;

  function invalidateListaCache() {
    listaPlanaCache = null;
  }

  function getPrecioVenta(cod, item) {
    if (item?.pvp != null && item.pvp > 0) return item.pvp;
    return PRECIOS_PVP[cod] || 0;
  }

  function getCatalogoMarcas() {
    return CATALOGO_MARCAS;
  }

  function getListaProductos() {
    if (listaPlanaCache) return listaPlanaCache;
    const list = [];
    Object.entries(CATALOGO_MARCAS).forEach(([marca, categorias]) => {
      Object.entries(categorias).forEach(([categoria, items]) => {
        items.forEach((item) => {
          list.push({
            cod: item.cod,
            nom: `${marca} – ${item.nom}`,
            marca,
            categoria,
            pvp: getPrecioVenta(item.cod, item),
          });
        });
      });
    });
    listaPlanaCache = list;
    return list;
  }

  function findRawItem(cod) {
    for (const categorias of Object.values(CATALOGO_MARCAS)) {
      for (const items of Object.values(categorias)) {
        const item = items.find((i) => i.cod === cod);
        if (item) return item;
      }
    }
    return null;
  }

  function getPrecioByCod(cod) {
    const item = findRawItem(cod);
    return getPrecioVenta(cod, item || { cod });
  }

  function findByCod(cod) {
    let found = null;
    Object.entries(CATALOGO_MARCAS).forEach(([marca, categorias]) => {
      Object.entries(categorias).forEach(([categoria, items]) => {
        items.forEach((item) => {
          if (item.cod === cod && !found) {
            found = {
              cod: item.cod,
              nom: `${marca} – ${item.nom}`,
              marca,
              categoria,
              pvp: getPrecioVenta(item.cod, item),
            };
          }
        });
      });
    });
    return found;
  }

  global.ArpaCatalogo = {
    getCatalogoMarcas,
    getListaProductos,
    findByCod,
    getPrecioVenta,
    getPrecioByCod,
  };
})(window);
