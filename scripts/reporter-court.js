// Reporter node:test à sortie courte : un résumé, plus le nom et le message de chaque échec.
module.exports = async function* (source) {
  let reussis = 0;
  let sautes = 0;
  const echecs = [];
  for await (const ev of source) {
    if (ev.type === 'test:pass') {
      if (ev.data.skip) sautes++;
      else reussis++;
    } else if (ev.type === 'test:fail') {
      const err = ev.data.details.error;
      echecs.push(`ECHEC ${ev.data.name}\n  ${String(err?.cause?.message ?? err?.message ?? err).split('\n')[0]}\n`);
    }
  }
  yield echecs.join('');
  yield `${reussis} réussis, ${echecs.length} échoués, ${sautes} sautés\n`;
};
