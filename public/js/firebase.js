// Seul module qui charge le SDK Firebase (modules ES du CDN officiel, version figée dans firebase-config.js).
// Il n'est importé qu'à la demande (import dynamique depuis reseau.js) : les écrans de démonstration
// et le reste de la page fonctionnent sans lui, et sans réseau.
// Le numéro de version est écrit en toutes lettres dans les adresses : un import statique ne peut pas
// être calculé. Un test vérifie qu'il est identique à VERSION_SDK.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getDatabase, connectDatabaseEmulator, ref, get, set, push, remove, runTransaction, onValue, onDisconnect, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';

// Ouvre la base choisie (voir choisirBase) et renvoie l'objet `fb` attendu par salon.js.
export function connecter(base) {
  const app = initializeApp({ projectId: base.projectId, databaseURL: base.databaseURL }, `romantasy-${base.nom}`);
  const db = getDatabase(app);
  if (base.emulateur) connectDatabaseEmulator(db, base.emulateur.hote, base.emulateur.port);
  return { db, ref, get, set, push, remove, runTransaction, onValue, onDisconnect, serverTimestamp, ...infos(db) };
}

// Phase 6 : informations locales du SDK (chemins « .info », tenus par le SDK lui-même : rien n'est lu ni écouté
// dans la base). `surConnexion(rappel)` : rappel(true) à chaque (re)connexion au serveur, rappel(false) à chaque
// coupure ; renvoie la fonction qui arrête l'écoute. `maintenant()` : heure estimée du serveur (heure du téléphone
// corrigée du décalage mesuré par le SDK), pour juger l'expiration d'une partie même avec une horloge déréglée.
export function infos(db) {
  let decalage = 0;
  onValue(ref(db, '.info/serverTimeOffset'), (instantane) => { decalage = Number(instantane.val()) || 0; });
  return {
    surConnexion: (rappel) => onValue(ref(db, '.info/connected'), (instantane) => rappel(instantane.val() === true)),
    maintenant: () => Date.now() + decalage,
  };
}
