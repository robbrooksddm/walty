// sanity/structure.ts
import type {StructureBuilder, StructureResolver} from 'sanity/desk'

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('cardTemplate').title('Card templates'),
      S.documentTypeListItem('cardProduct' ).title('Card products'),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (i) => !['cardTemplate','cardProduct'].includes(i.getId() || '')
      ),
    ])