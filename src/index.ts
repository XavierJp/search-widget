const debounce = (func: (...args: any[]) => any, timeout = 300) => {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      //@ts-ignore
      func.apply(this, args);
    }, timeout);
  };
};

const fetchWrapper = async (url: string, timeout = 1000) => {
  return await Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      window.setTimeout(() => reject(new Error("Timeout")), timeout)
    ),
  ]);
};

const formatIntFr = (intAsString = "") => {
  try {
    return intAsString.replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
  } catch (e: any) {
    return intAsString;
  }
};

const capitalize = (str: string) => {
  if (!str) return str;

  return str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
};

const annuaireLink = (label = "l’Annuaire des Entreprises") =>
  `<a target="_blank" href='https://annuaire-entreprises.data.gouv.fr/recherche-siren'>${label}</a>`;

class SearchWidget {
  private input: HTMLInputElement;
  private wrapper: HTMLElement;
  private loader: HTMLElement;
  private resultList: HTMLElement;
  private moreResults: HTMLElement;
  private errorMessage: HTMLElement;

  constructor(private id: string) {
    this.id = id;
    const input = document.getElementById(this.id) as HTMLInputElement;
    if (!input) {
      throw new Error("Could not find input with id: " + this.id);
    }
    this.input = input;
    this.wrapper = this.createWrapper();
    this.loader = this.createLoader();
    this.errorMessage = this.createErrorMessage();
    this.resultList = this.createResultList();
    this.moreResults = this.createMoreResultsLink();
  }

  init = () => {
    this.positionWrapper();
    const debouncedOnChange = debounce(this.onChange);
    this.input.addEventListener("input", (e) => debouncedOnChange(e));
    this.input.addEventListener("blur", () => this.hide(this.wrapper));
    this.input.addEventListener("focus", () => {
      this.show(this.wrapper);
      this.search();
    });
  };

  onChange = () => {
    this.search();
  };

  search() {
    const searchTerm = this.input.value;
    this.show(this.loader);
    this.clearResultList();
    if (!!searchTerm) {
      // fetchWrapper(
      //   "http://api.sirene.dataeng.annuaire-entreprises-infra.etalab.studio/search?q=" +
      //     encodeURIComponent(searchTerm)
      // )
      //   .then((response) => {
      //     this.updateResultList(response as any[]);
      //   })
      //   .catch(() => {
      //     this.setError();
      //   })
      //   .finally(() => this.hide(this.loader));

      window.setTimeout(() => {
        this.updateResultList(rawData);
        this.hide(this.loader);
      }, 300);
    } else {
      this.hide(this.loader);
    }
  }

  /**
   * DOM Methods
   **/
  show(element: HTMLElement) {
    element.style.display = "block";
  }

  hide(element: HTMLElement) {
    element.style.display = "none";
  }

  // Wrapper
  createWrapper() {
    const wrapper = document.createElement("div");
    wrapper.id = "wrapper";
    document.body.appendChild(wrapper);
    this.hide(wrapper);
    return wrapper;
  }

  positionWrapper() {
    const inputRect = this.input.getBoundingClientRect();
    this.wrapper.style.zIndex = "100";
    this.wrapper.style.width = `${inputRect.width}px`;
    this.wrapper.style.position = "absolute";
    this.wrapper.style.top = `${inputRect.top + inputRect.height}px`;
    this.wrapper.style.left = `${inputRect.left}px`;
  }

  // Loader
  createLoader() {
    const loader = document.createElement("div");
    loader.className = "loader";
    loader.innerHTML = `
         <span>Loading...</span>
         `;
    this.wrapper.appendChild(loader);
    this.hide(loader);
    return loader;
  }

  // Error
  createErrorMessage() {
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    this.wrapper.appendChild(errorMessage);
    this.hide(errorMessage);
    return errorMessage;
  }
  setError() {
    this.errorMessage.innerHTML = `<i>La recherche d’entreprise ne fonctionne pas. Assurez-vous d'être bien connecté à internet.<br/> Si le problème persiste, vous pouvez effectuer votre recherche sur ${annuaireLink()}.</i>`;
    this.show(this.errorMessage);
  }

  // Results
  createResultList() {
    const resultList = document.createElement("div");
    resultList.className = "result-list";
    this.wrapper.appendChild(resultList);
    return resultList;
  }
  clearResultList() {
    this.resultList.innerHTML = "";
    this.hide(this.moreResults);
    this.hide(this.errorMessage);
  }
  updateResultList(results: any[]) {
    if (!results || results.length === 0) {
      this.resultList.innerHTML = "";
    }
    const { unite_legale } = results as any;
    unite_legale
      .map((item: any) => {
        const itemDom = document.createElement("div");
        itemDom.innerHTML = `<span>${capitalize(
          item.nom_complet
        )}</span><i>${formatIntFr(item.siren)}</i>`;
        itemDom.className = "item";
        itemDom.addEventListener("mousedown", (e) => {
          // stop default to avoid bluring befor "click" event
          e.preventDefault();
        });
        itemDom.addEventListener("click", (e) => {
          e.preventDefault();
          this.input.value = item.siren;
          this.input.blur();
        });
        return itemDom;
      })
      .forEach((element: HTMLElement) => {
        this.resultList.appendChild(element);
      });
    this.show(this.moreResults);
  }

  createMoreResultsLink() {
    const more = document.createElement("div");
    more.innerHTML = `<div class='more'>${annuaireLink(
      "⇢ recherche avancée sur l’Annuaire des Entreprises"
    )}</div>`;
    this.wrapper.appendChild(more);
    this.hide(more);
    return more;
  }
}

const inputWidget = new SearchWidget("search-widget");
inputWidget.init();

// TODO
// gérer pas de réseau -> ok
// gérer polyfill et échec d'init
// CORS
// prefix CSS
// penser a une logique de cache -> browser network ? Cache-Control
// spelling
// placeholder and defaults
//

const rawData = {
  unite_legale: [
    {
      siren: "414971929",
      siret: "41497192900040",
      date_creation: "2013-07-01 00:00:00",
      tranche_effectif_salarie: "01",
      is_siege: "true",
      type_voie: "RUE",
      libelle_voie: "RIGOBERTA MENCHU",
      code_postal: "84000",
      libelle_commune: "AVIGNON",
      commune: "84007",
      date_debut_activite: "2013-07-01 00:00:00",
      etat_administratif_etablissement: "A",
      activite_principale: "64.30Z",
      longitude: "4.784775",
      latitude: "43.926703",
      geo_adresse: "Rue Rigoberta Menchu 84000 Avignon",
      date_creation_entreprise: "1997-12-08 00:00:00",
      tranche_effectif_salarie_entreprise: "01",
      date_mise_a_jour: "2021-10-27 08:38:30",
      categorie_entreprise: "PME",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "FINANCIERE GANYMEDE",
      nature_juridique_entreprise: 5710,
      activite_principale_entreprise: "64.30Z",
      nom_complet: "financiere ganymede",
      nombre_etablissements: 4.0,
      liste_enseigne: "[]",
      liste_adresse:
        "['60 Avenue du G\u00e9n\u00e9ral de Gaulle 92800 Puteaux', '4 Chemin des Sablons 78160 Marly-le-Roi', 'Rue Rigoberta Menchu 84000 Avignon', '26 Boulevard Saint-Roch 84000 Avignon']",
      nombre_etablissements_ouvert: 2.0,
      concat_nom_adr_siren:
        "financiere ganymede Rue Rigoberta Menchu 84000 Avignon 414971929",
      concat_enseigne_adresse:
        "['60 Avenue du G\u00e9n\u00e9ral de Gaulle 92800 Puteaux', '4 Chemin des Sablons 78160 Marly-le-Roi', 'Rue Rigoberta Menchu 84000 Avignon', '26 Boulevard Saint-Roch 84000 Avignon']",
    },
    {
      siren: "383657467",
      siret: "38365746700023",
      date_creation: "1993-12-25 00:00:00",
      is_siege: "true",
      numero_voie: "48",
      libelle_voie: "CAMI DEL BLAGAIRE",
      code_postal: "34270",
      libelle_commune: "SAINT-MATHIEU-DE-TREVIERS",
      commune: "34276",
      date_debut_activite: "2008-01-01 00:00:00",
      etat_administratif_etablissement: "A",
      activite_principale: "94.99Z",
      longitude: "3.866137",
      latitude: "43.763569",
      geo_adresse: "Rue Del Blagaire 34270 Saint-Mathieu-de-Tr\u00e9viers",
      date_creation_entreprise: "1991-11-01 00:00:00",
      date_mise_a_jour: "2017-05-20 02:14:10",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "ASSOCIATION GANYMEDE",
      nature_juridique_entreprise: 9220,
      activite_principale_entreprise: "94.99Z",
      economie_sociale_solidaire_unite_legale: "O",
      nom_complet: "association ganymede",
      nombre_etablissements: 2.0,
      liste_enseigne: "['GANYMEDE AUDIO-VISUEL']",
      liste_adresse:
        "['13 Place Fabre d\u2019Olivet 34190 Ganges', 'Rue Del Blagaire 34270 Saint-Mathieu-de-Tr\u00e9viers']",
      nombre_etablissements_ouvert: 1.0,
      concat_nom_adr_siren:
        "association ganymede Rue Del Blagaire 34270 Saint-Mathieu-de-Tr\u00e9viers 383657467",
      concat_enseigne_adresse:
        "['GANYMEDE AUDIO-VISUEL', '13 Place Fabre d\u2019Olivet 34190 Ganges', 'Rue Del Blagaire 34270 Saint-Mathieu-de-Tr\u00e9viers']",
    },
    {
      siren: "423208180",
      siret: "42320818000012",
      date_creation: "1999-04-07 00:00:00",
      tranche_effectif_salarie: "NN",
      is_siege: "true",
      type_voie: "RTE",
      libelle_voie: "DE GRUISSAN",
      code_postal: "11100",
      libelle_commune: "NARBONNE",
      commune: "11262",
      date_debut_activite: "2008-01-01 00:00:00",
      etat_administratif_etablissement: "A",
      activite_principale: "68.20B",
      longitude: "3.047004",
      latitude: "43.153077",
      geo_adresse: "Route de Gruissan 11100 Narbonne",
      date_creation_entreprise: "1999-04-07 00:00:00",
      tranche_effectif_salarie_entreprise: "NN",
      date_mise_a_jour: "2018-10-17 04:04:59",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "GANYMEDE",
      nature_juridique_entreprise: 6540,
      activite_principale_entreprise: "68.20B",
      economie_sociale_solidaire_unite_legale: "N",
      nom_complet: "ganymede",
      nombre_etablissements: 1.0,
      liste_enseigne: "[]",
      liste_adresse: "['Route de Gruissan 11100 Narbonne']",
      nombre_etablissements_ouvert: 1.0,
      concat_nom_adr_siren:
        "ganymede Route de Gruissan 11100 Narbonne 423208180",
      concat_enseigne_adresse: "['Route de Gruissan 11100 Narbonne']",
    },
    {
      siren: "510973431",
      siret: "51097343100024",
      date_creation: "2018-11-09 00:00:00",
      is_siege: "true",
      numero_voie: "3",
      type_voie: "TRA",
      libelle_voie: "DES PENITENTS NOIRS",
      code_postal: "13600",
      libelle_commune: "LA CIOTAT",
      commune: "13028",
      date_debut_activite: "2018-11-09 00:00:00",
      etat_administratif_etablissement: "A",
      activite_principale: "68.20B",
      longitude: "5.607033",
      latitude: "43.176651",
      geo_adresse: "Traverse des P\u00e9nitents Noirs 13600 La Ciotat",
      date_creation_entreprise: "2009-01-28 00:00:00",
      date_mise_a_jour: "2019-01-14 10:31:18",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "GANYMEDE",
      nature_juridique_entreprise: 6540,
      activite_principale_entreprise: "68.20B",
      economie_sociale_solidaire_unite_legale: "N",
      nom_complet: "ganymede",
      nombre_etablissements: 2.0,
      liste_enseigne: "[]",
      liste_adresse:
        "['Traverse des P\u00e9nitents Noirs 13600 La Ciotat', '1135 Chemin du Baguier 13600 La Ciotat']",
      nombre_etablissements_ouvert: 1.0,
      concat_nom_adr_siren:
        "ganymede Traverse des P\u00e9nitents Noirs 13600 La Ciotat 510973431",
      concat_enseigne_adresse:
        "['Traverse des P\u00e9nitents Noirs 13600 La Ciotat', '1135 Chemin du Baguier 13600 La Ciotat']",
    },
    {
      siren: "880878145",
      siret: "88087814500015",
      date_creation: "2020-01-13 00:00:00",
      is_siege: "true",
      numero_voie: "128",
      type_voie: "RUE",
      libelle_voie: "LA BOETIE",
      code_postal: "75008",
      libelle_commune: "PARIS 8",
      commune: "75108",
      date_debut_activite: "2021-12-31 00:00:00",
      etat_administratif_etablissement: "A",
      activite_principale: "62.02A",
      longitude: "2.305916",
      latitude: "48.870938",
      geo_adresse: "128 Rue la Bo\u00e9tie 75008 Paris",
      date_creation_entreprise: "2020-01-13 00:00:00",
      date_mise_a_jour: "2022-03-29 08:43:00",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "GANYMEDE",
      nature_juridique_entreprise: 5710,
      activite_principale_entreprise: "62.02A",
      economie_sociale_solidaire_unite_legale: "N",
      nom_complet: "ganymede",
      nombre_etablissements: 1.0,
      liste_enseigne: "[]",
      liste_adresse: "['128 Rue la Bo\u00e9tie 75008 Paris']",
      nombre_etablissements_ouvert: 1.0,
      concat_nom_adr_siren:
        "ganymede 128 Rue la Bo\u00e9tie 75008 Paris 880878145",
      concat_enseigne_adresse: "['128 Rue la Bo\u00e9tie 75008 Paris']",
    },
    {
      siren: "817883150",
      siret: "81788315000010",
      date_creation: "2016-01-15 00:00:00",
      tranche_effectif_salarie: "01",
      is_siege: "true",
      numero_voie: "3",
      type_voie: "RUE",
      libelle_voie: "DE LA GAITE",
      code_postal: "75014",
      libelle_commune: "PARIS 14",
      commune: "75114",
      date_debut_activite: "2017-06-01 00:00:00",
      etat_administratif_etablissement: "A",
      activite_principale: "70.22Z",
      longitude: "2.324549",
      latitude: "48.84074",
      geo_adresse: "3 Rue de la Ga\u00eet\u00e9 75014 Paris",
      date_creation_entreprise: "2016-01-15 00:00:00",
      tranche_effectif_salarie_entreprise: "01",
      date_mise_a_jour: "2021-10-27 09:23:04",
      categorie_entreprise: "PME",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "GANYMEDE",
      nature_juridique_entreprise: 5710,
      activite_principale_entreprise: "70.22Z",
      economie_sociale_solidaire_unite_legale: "N",
      nom_complet: "ganymede",
      nombre_etablissements: 1.0,
      liste_enseigne: "[]",
      liste_adresse: "['3 Rue de la Ga\u00eet\u00e9 75014 Paris']",
      nombre_etablissements_ouvert: 1.0,
      concat_nom_adr_siren:
        "ganymede 3 Rue de la Ga\u00eet\u00e9 75014 Paris 817883150",
      concat_enseigne_adresse: "['3 Rue de la Ga\u00eet\u00e9 75014 Paris']",
    },
    {
      siren: "393120142",
      siret: "39312014200012",
      date_creation: "1993-10-07 00:00:00",
      tranche_effectif_salarie: "NN",
      is_siege: "true",
      numero_voie: "21",
      type_voie: "IMP",
      libelle_voie: "DES ARES",
      code_postal: "31240",
      libelle_commune: "L'UNION",
      commune: "31561",
      date_debut_activite: "2000-03-31 00:00:00",
      etat_administratif_etablissement: "F",
      activite_principale: "71.4B",
      longitude: "1.484422",
      latitude: "43.654059",
      geo_adresse: "21 Impasse des Ares 31240 L'Union",
      date_creation_entreprise: "1993-10-07 00:00:00",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "GANYMEDE",
      nature_juridique_entreprise: 2900,
      activite_principale_entreprise: "71.4B",
      nom_complet: "ganymede",
      nombre_etablissements: 1.0,
      liste_enseigne: "[]",
      liste_adresse: '["21 Impasse des Ares 31240 L\'Union"]',
      concat_nom_adr_siren:
        "ganymede 21 Impasse des Ares 31240 L'Union 393120142",
      concat_enseigne_adresse: '["21 Impasse des Ares 31240 L\'Union"]',
    },
    {
      siren: "423448091",
      siret: "42344809100011",
      date_creation: "1999-07-01 00:00:00",
      tranche_effectif_salarie: "NN",
      is_siege: "true",
      numero_voie: "126",
      type_voie: "IMP",
      libelle_voie: "JUVENAL",
      code_postal: "30900",
      libelle_commune: "NIMES",
      commune: "30189",
      date_debut_activite: "2001-10-22 00:00:00",
      etat_administratif_etablissement: "F",
      activite_principale: "51.6G",
      longitude: "4.343645",
      latitude: "43.820621",
      geo_adresse: "126 Impasse Juvenal 30900 N\u00eemes",
      date_creation_entreprise: "1999-07-01 00:00:00",
      etat_administratif_unite_legale: "C",
      nom_raison_sociale: "GANYMED",
      nature_juridique_entreprise: 5499,
      activite_principale_entreprise: "51.6G",
      nom_complet: "ganymed",
      nombre_etablissements: 1.0,
      liste_enseigne: "[]",
      liste_adresse: "['126 Impasse Juvenal 30900 N\u00eemes']",
      concat_nom_adr_siren:
        "ganymed 126 Impasse Juvenal 30900 N\u00eemes 423448091",
      concat_enseigne_adresse: "['126 Impasse Juvenal 30900 N\u00eemes']",
    },
    {
      siren: "408023240",
      siret: "40802324000018",
      date_creation: "1996-05-30 00:00:00",
      is_siege: "true",
      numero_voie: "110",
      type_voie: "RUE",
      libelle_voie: "CHANZY",
      code_postal: "72000",
      libelle_commune: "LE MANS",
      commune: "72181",
      date_debut_activite: "2018-10-16 00:00:00",
      etat_administratif_etablissement: "F",
      activite_principale: "66.30Z",
      longitude: "0.203004",
      latitude: "47.997314",
      geo_adresse: "110 Rue Chanzy 72000 Le Mans",
      date_creation_entreprise: "1996-05-30 00:00:00",
      date_mise_a_jour: "2019-05-16 04:18:28",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "GANYMEDE",
      nature_juridique_entreprise: 6599,
      activite_principale_entreprise: "66.30Z",
      nom_complet: "ganymede",
      nombre_etablissements: 1.0,
      liste_enseigne: "[]",
      liste_adresse: "['110 Rue Chanzy 72000 Le Mans']",
      concat_nom_adr_siren: "ganymede 110 Rue Chanzy 72000 Le Mans 408023240",
      concat_enseigne_adresse: "['110 Rue Chanzy 72000 Le Mans']",
    },
    {
      siren: "803657048",
      siret: "80365704800010",
      date_creation: "2014-03-17 00:00:00",
      is_siege: "true",
      numero_voie: "4",
      type_voie: "IMP",
      libelle_voie: "BEL AIR",
      code_postal: "57970",
      libelle_commune: "YUTZ",
      commune: "57757",
      date_debut_activite: "2014-03-17 00:00:00",
      etat_administratif_etablissement: "A",
      activite_principale: "68.20B",
      longitude: "6.197629",
      latitude: "49.347506",
      geo_adresse: "4 Impasse Bel Air 57970 Yutz",
      date_creation_entreprise: "2014-03-17 00:00:00",
      date_mise_a_jour: "2019-11-19 03:47:05",
      etat_administratif_unite_legale: "A",
      nom_raison_sociale: "GANYMEDE",
      nature_juridique_entreprise: 6599,
      activite_principale_entreprise: "68.20B",
      economie_sociale_solidaire_unite_legale: "N",
      nom_complet: "ganymede",
      nombre_etablissements: 1.0,
      liste_enseigne: "[]",
      liste_adresse: "['4 Impasse Bel Air 57970 Yutz']",
      nombre_etablissements_ouvert: 1.0,
      concat_nom_adr_siren: "ganymede 4 Impasse Bel Air 57970 Yutz 803657048",
      concat_enseigne_adresse: "['4 Impasse Bel Air 57970 Yutz']",
    },
  ],
  total_results: 155,
  page: 1,
  per_page: 10,
  total_pages: 16,
};

export {};
