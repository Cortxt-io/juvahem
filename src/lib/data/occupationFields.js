// The 21 JobTech occupation fields — source for the job dropdowns.
// Imported from the root data/ file the ETL produces.

import data from '../../../data/occupation_fields.json';

/** @type {{id:string,label:string}[]} sorted alphabetically by label (sv) */
export const occupationFields = [...data.fields].sort((a, b) =>
  a.label.localeCompare(b.label, 'sv')
);

export const occupationLabel = new Map(occupationFields.map((f) => [f.id, f.label]));
