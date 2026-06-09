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

  let listaPlanaCache = null;

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
            pvp: item.pvp || 0,
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
  };
})(window);
