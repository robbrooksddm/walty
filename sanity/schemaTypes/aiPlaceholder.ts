/**********************************************************************
 * aiPlaceholder.ts  –  reusable “face-swap prompt” document
 *
 * NOTE
 * ────
 * • We do **not** add our own “version” field.  Sanity automatically
 *   maintains `_updatedAt` and `_rev` on every document.  Our server
 *   code (getPromptForPlaceholder) now queries `_updatedAt` and passes
 *   it back as `version`, so any time you edit the prompt and press
 *   “Publish” a new timestamp string comes through → KV key changes →
 *   fresh images are generated.
 *********************************************************************/
import { defineType, defineField } from 'sanity';
import { ComposeIcon }             from '@sanity/icons';

export default defineType({
  name : 'aiPlaceholder',
  type : 'document',
  title: 'AI face-swap placeholder',
  icon : ComposeIcon,

  fields: [
    /*  Prompt text sent to GPT-Image-1  */
    defineField({
      name : 'prompt',
      type : 'text',
      rows : 3,
      title: 'Prompt sent to OpenAI',
      validation: r => r.required(),
    }),

    /*  Optional reference style image (kept in the Studio for now)  */
    defineField({
      name : 'refImage',
      type : 'image',
      title: 'Reference style image (optional)',
      options: { hotspot: true },
    }),
  ],
});