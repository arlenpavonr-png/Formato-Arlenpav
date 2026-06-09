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
        { cod: 'BFT-600', nom: 'BFT 600 – motor corrediza' },
        { cod: 'BFT-1000', nom: 'BFT 1000 – motor corrediza' },
        { cod: 'BFT-1500', nom: 'BFT 1500 – motor corrediza' },
        { cod: 'BFT-2000', nom: 'BFT 2000 – motor corrediza' },
      ],
      'Batiente 1 hoja': [
        { cod: 'BFT-BTA25', nom: 'BFT BTA 25 – brazo batiente 1 hoja' },
        { cod: 'BFT-BTA40', nom: 'BFT BTA 40 – brazo batiente 1 hoja' },
        { cod: 'BFT-LUX2B', nom: 'BFT Lux 2B – barrera vehicular' },
      ],
      'Batiente 2 hojas': [
        { cod: 'BFT-BTA25', nom: 'BFT BTA 25 – brazos batiente 2 hojas' },
        { cod: 'BFT-BTA40', nom: 'BFT BTA 40 – brazos batiente 2 hojas' },
      ],
      'Barrera vehicular': [
        { cod: 'BFT-LUX2B', nom: 'BFT Lux 2B – barrera vehicular' },
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
  };

  let listaPlanaCache = null;

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

  function findByCod(cod) {
    return getListaProductos().find((p) => p.cod === cod) || null;
  }

  global.ArpaCatalogo = {
    getCatalogoMarcas,
    getListaProductos,
    findByCod,
    getPrecioVenta,
  };
})(window);
