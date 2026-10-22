// Choix de l'écran d'après l'adresse (?ecran=…) et place des outils de démonstration (phase 8).
// Les outils de validation (écrans fictifs ?ecran=choix, carte, attente, transition, fin ; ?demo=1 ; salle fictive)
// ne servent qu'en local (ordinateur ou réseau local) : sur la page en ligne, ils sont ignorés et la page s'ouvre
// sur l'accueil. La partie en réseau (?ecran=jeu&code=…) et la salle d'attente (?ecran=salle&code=…) restent
// ouvertes partout.

export const NOMS_ECRANS = ['accueil', 'regles', 'creer', 'rejoindre', 'salle', 'choix', 'carte', 'attente', 'transition', 'fin', 'jeu'];

// Écrans qui n'existent qu'avec des données fictives (la partie en réseau a sa propre adresse, ?ecran=jeu).
export const ECRANS_DEMONSTRATION = ['choix', 'carte', 'attente', 'transition', 'fin'];

// Paramètres de la salle fictive (voir ecrans.salle) : leur présence ouvre la salle de démonstration.
export const PARAMETRES_SALLE_FICTIVE = ['hote', 'autres', 'complete', 'prenom', 'embleme', 'pret'];

// Renvoie { nom, demo } : l'écran à afficher et le mode démonstration (données fictives, sans base).
// `local` : page servie depuis l'ordinateur ou le réseau local (estAdresseLocale de firebase-config.js).
export function ecranAffiche(params, local) {
  const demande = params.get('ecran');
  let nom = NOMS_ECRANS.includes(demande) ? demande : 'accueil';
  if (!local && ECRANS_DEMONSTRATION.includes(nom)) nom = 'accueil';
  // Salle fictive (paramètres fictifs, sans code) ouverte en ligne : accueil, comme les autres écrans fictifs.
  const salleFictive = PARAMETRES_SALLE_FICTIVE.some((p) => params.has(p));
  if (!local && nom === 'salle' && !params.get('code') && salleFictive) nom = 'accueil';
  const demo = local && (params.get('demo') === '1' || (nom === 'salle' && salleFictive));
  if (nom === 'jeu' && demo) nom = 'accueil'; // pas de partie en réseau en démonstration
  return { nom, demo };
}
