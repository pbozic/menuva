import type { MenuData } from "./types";

/** Built-in demo menu shown at /m/demo — handy for sales visits and for trying the UI without a database. */
export const DEMO_MENU: MenuData = {
  restaurant: {
    id: "demo",
    owner_id: "demo",
    name: "Gostilna Pri Lipi",
    slug: "demo",
    accent_color: "#9a3412",
    source_lang: "sl",
    languages: ["sl", "en", "de", "it", "hr"],
    currency: "EUR",
    created_at: "2026-01-01",
  },
  categories: [
    {
      id: "c1",
      restaurant_id: "demo",
      position: 0,
      name: { sl: "Juhe in enolončnice", en: "Soups & Stews", de: "Suppen & Eintöpfe", it: "Zuppe e minestre", hr: "Juhe i variva" },
      items: [
        {
          id: "i1", restaurant_id: "demo", category_id: "c1", position: 0, price: 7.5,
          name: { sl: "Jota", en: "Jota – sauerkraut and bean stew with smoked pork", de: "Jota – Sauerkraut-Bohnen-Eintopf mit Räucherfleisch", it: "Jota – minestra di crauti e fagioli con carne affumicata", hr: "Jota – varivo od kiselog kupusa i graha sa suhim mesom" },
          description: { sl: "Kislo zelje, fižol, krompir, prekajena svinjina", en: "Sauerkraut, beans, potatoes, smoked pork", de: "Sauerkraut, Bohnen, Kartoffeln, geräuchertes Schweinefleisch", it: "Crauti, fagioli, patate, maiale affumicato", hr: "Kiseli kupus, grah, krumpir, dimljena svinjetina" },
          allergens: [9], allergens_confirmed: true, available: true,
        },
        {
          id: "i2", restaurant_id: "demo", category_id: "c1", position: 1, price: 4.5,
          name: { sl: "Goveja juha z rezanci", en: "Beef broth with noodles", de: "Rindssuppe mit Nudeln", it: "Brodo di manzo con tagliolini", hr: "Goveđa juha s rezancima" },
          description: {},
          allergens: [1, 3, 9], allergens_confirmed: true, available: true,
        },
      ],
    },
    {
      id: "c2",
      restaurant_id: "demo",
      position: 1,
      name: { sl: "Glavne jedi", en: "Main Courses", de: "Hauptgerichte", it: "Secondi piatti", hr: "Glavna jela" },
      items: [
        {
          id: "i3", restaurant_id: "demo", category_id: "c2", position: 0, price: 13.9,
          name: { sl: "Idrijski žlikrofi z bakalco", en: "Idrija žlikrofi – potato dumplings with lamb ragout", de: "Idrijski žlikrofi – Kartoffelteigtaschen mit Lammragout", it: "Žlikrofi di Idrija – fagottini di patate con ragù d'agnello", hr: "Idrijski žlikrofi – okruglice s krumpirom i janjećim raguom" },
          description: { sl: "Zaščitena jed z geografsko označbo", en: "Protected regional speciality", de: "Geschützte regionale Spezialität", it: "Specialità regionale protetta", hr: "Zaštićeni regionalni specijalitet" },
          allergens: [1, 3, 9], allergens_confirmed: true, available: true,
        },
        {
          id: "i4", restaurant_id: "demo", category_id: "c2", position: 1, price: 12.5,
          name: { sl: "Kranjska klobasa s kislim zeljem", en: "Carniolan sausage with sauerkraut", de: "Krainer Wurst mit Sauerkraut", it: "Salsiccia della Carniola con crauti", hr: "Kranjska kobasica s kiselim kupusom" },
          description: { sl: "Gorčica in hren", en: "Mustard and horseradish", de: "Senf und Kren", it: "Senape e rafano", hr: "Senf i hren" },
          allergens: [10], allergens_confirmed: true, available: true,
        },
      ],
    },
    {
      id: "c3",
      restaurant_id: "demo",
      position: 2,
      name: { sl: "Sladice", en: "Desserts", de: "Desserts", it: "Dolci", hr: "Deserti" },
      items: [
        {
          id: "i5", restaurant_id: "demo", category_id: "c3", position: 0, price: 5.9,
          name: { sl: "Skutni štruklji", en: "Štruklji – rolled dumplings with cottage cheese", de: "Štruklji – gerollte Topfenstrudel-Knödel", it: "Štruklji – involtini di pasta ripieni di ricotta", hr: "Štrukli – savijača sa svježim sirom" },
          description: { sl: "Kuhani, z maslenimi drobtinami", en: "Boiled, with buttered breadcrumbs", de: "Gekocht, mit Butterbröseln", it: "Bolliti, con pangrattato al burro", hr: "Kuhani, s mrvicama na maslacu" },
          allergens: [1, 3, 7], allergens_confirmed: true, available: true,
        },
        {
          id: "i6", restaurant_id: "demo", category_id: "c3", position: 1, price: 6.5,
          name: { sl: "Prekmurska gibanica", en: "Prekmurska gibanica – layered cake with poppy seeds, cottage cheese, walnuts and apples", de: "Prekmurska gibanica – Schichtkuchen mit Mohn, Topfen, Walnüssen und Äpfeln", it: "Prekmurska gibanica – torta a strati con papavero, ricotta, noci e mele", hr: "Prekmurska gibanica – slojeviti kolač s makom, sirom, orasima i jabukama" },
          description: {},
          allergens: [1, 3, 7, 8], allergens_confirmed: true, available: false,
        },
      ],
    },
  ],
};
