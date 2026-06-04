import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

const rows = parse(fs.readFileSync('/tmp/clp_update.csv'), { columns: true });
console.log('rows', rows.length);

let ok=0, err=0;
const conc = 30;
let i=0;
async function worker() {
  while (i < rows.length) {
    const r = rows[i++];
    const { error } = await sb.from('clp_substances_db')
      .update({ pictograms: r.pictograms, labelling_h_codes: r.labelling_h_codes })
      .eq('index_no', r.index_no);
    if (error) { err++; if (err<5) console.error(error.message); } else ok++;
    if ((ok+err)%500===0) console.log(ok+err, 'done');
  }
}
await Promise.all(Array.from({length:conc}, worker));
console.log('OK', ok, 'ERR', err);
