// Chargement des données du jeu depuis public/data/ (aucun réseau externe).

async function lireJson(nom) {
  const reponse = await fetch(`data/${nom}`);
  if (!reponse.ok) throw new Error(`Impossible de charger data/${nom} (${reponse.status})`);
  return reponse.json();
}

export async function chargerDonnees() {
  const [cartes, emblemes, config, codes] = await Promise.all([
    lireJson('cartes.json'),
    lireJson('emblemes.json'),
    lireJson('config.json'),
    lireJson('codes.json'),
  ]);
  return { cartes, emblemes, config, codes };
}
