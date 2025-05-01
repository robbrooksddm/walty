// sanity/structure.ts
import type { StructureBuilder, StructureResolver } from 'sanity/desk'

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // the only doc type we actually have right now
      S.documentTypeListItem('cardTemplate').title('Card templates'),

      // keep this – it shows any future types you add
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => item.getId() && !['cardTemplate'].includes(item.getId()!),
      ),
    ])
