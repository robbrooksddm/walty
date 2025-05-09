import {StructureBuilder} from 'sanity/desk'

export default (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Card templates the staff edit
      S.listItem()
        .title('Card templates')
        .schemaType('cardTemplate')
        .child(S.documentTypeList('cardTemplate')),

      // Live, customer-facing copies (read-only)
      S.listItem()
        .title('Published cards')
        .schemaType('cardStoreCopy')
        .child(S.documentTypeList('cardStoreCopy')),

      S.divider(),

      // Everything else
      ...S.documentTypeListItems().filter(
        li => !['cardTemplate', 'cardStoreCopy'].includes(li.getId()!)
      ),
    ])