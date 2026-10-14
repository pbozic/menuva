/**
 * How to render traditional Slovenian / regional dishes for foreign guests.
 * This glossary is the product's main quality edge — keep adding to it.
 *
 * Rule of thumb: keep the original name (it is part of the experience) and add a
 * short, appetising description in the guest's language, e.g.
 *   "Štruklji" → EN "Štruklji – rolled dumplings with cottage cheese"
 */
export const DISH_GLOSSARY: { sl: string; note: string }[] = [
  { sl: "Štruklji", note: "rolled, boiled or baked dough filled (usually with cottage cheese/skuta, tarragon, walnuts, apple...)" },
  { sl: "Jota", note: "Karst/Littoral stew of sauerkraut or sour turnip, beans, potatoes and smoked pork" },
  { sl: "Ričet", note: "barley stew with beans and smoked pork" },
  { sl: "Kranjska klobasa", note: "Carniolan sausage, smoked pork sausage with protected geographical indication" },
  { sl: "Prekmurska gibanica", note: "layered pastry cake with poppy seeds, cottage cheese, walnuts and apples" },
  { sl: "Potica", note: "rolled yeast cake, most often with walnut filling" },
  { sl: "Idrijski žlikrofi", note: "small potato-filled dumplings from Idrija (PGI), often served with bakalca (lamb ragout)" },
  { sl: "Bakalca", note: "lamb or mutton ragout, the traditional sauce for žlikrofi" },
  { sl: "Ajdovi žganci", note: "buckwheat spoonbread / crumbled buckwheat porridge" },
  { sl: "Žganci", note: "crumbled cornmeal or buckwheat spoonbread" },
  { sl: "Kremšnita", note: "Bled cream slice: puff pastry with vanilla custard and whipped cream" },
  { sl: "Bograč", note: "Prekmurje goulash with several kinds of meat and paprika" },
  { sl: "Matevž", note: "mashed beans and potatoes" },
  { sl: "Pršut", note: "air-dried Karst ham (like prosciutto)" },
  { sl: "Teran", note: "red wine from the Karst region" },
  { sl: "Skuta", note: "fresh cottage cheese / curd cheese" },
  { sl: "Ocvirki", note: "pork cracklings" },
  { sl: "Krvavica", note: "blood sausage with buckwheat or barley" },
  { sl: "Pečenica", note: "roasted pork sausage" },
  { sl: "Kislo zelje", note: "sauerkraut" },
  { sl: "Kisla repa", note: "sour turnip (fermented, like sauerkraut)" },
  { sl: "Njoki", note: "potato gnocchi" },
  { sl: "Fuži", note: "Istrian hand-rolled pasta quills" },
  { sl: "Brodet", note: "Littoral fish stew in tomato sauce, usually served with polenta" },
  { sl: "Polenta", note: "polenta / cornmeal" },
  { sl: "Mlinci", note: "thin baked flatbread pieces soaked in roast juices" },
  { sl: "Domače", note: "homemade" },
  { sl: "Dnevna juha", note: "soup of the day" },
  { sl: "Malica / dnevna malica", note: "lunch menu / daily set lunch" },
  { sl: "Pomfri", note: "French fries / chips" },
  { sl: "Zrezek", note: "cutlet / schnitzel (check whether breaded = dunajski zrezek / Wiener schnitzel)" },
  { sl: "Čevapčiči", note: "grilled minced-meat rolls (ćevapi), usually with ajvar and onion" },
  { sl: "Pljeskavica", note: "grilled spiced minced-meat patty" },
  { sl: "Ajvar", note: "roasted red pepper relish" },
];

export function glossaryForPrompt(): string {
  return DISH_GLOSSARY.map((g) => `- ${g.sl}: ${g.note}`).join("\n");
}
