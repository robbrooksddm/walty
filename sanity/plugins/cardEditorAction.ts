/**********************************************************************
 * sanity/plugins/cardEditorAction.ts
 * Adds a custom “Open editor” button to cardTemplate documents.
 *********************************************************************/

import type {
  DocumentActionComponent,
  DocumentActionProps,
} from 'sanity'
import {EditIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'               // ✅ correct import
import {useDocumentOperation} from 'sanity'

/** Where the staff-side editor runs */
const FRONTEND_BASE =
  process.env.NEXT_PUBLIC_APP_ORIGIN || 'http://localhost:3000'

const cardEditorAction: DocumentActionComponent = (
  props: DocumentActionProps,
) => {
  /* 1 ▸ show the button only on cardTemplate docs */
  if (props.type !== 'cardTemplate') return null

  /* 2 ▸ helper hooks */
  const toast = useToast()
  const {publish} = useDocumentOperation(props.id, props.type) // keeps TS happy

  /* 3 ▸ need an ID: hide the button until the first save */
  const rawId = props.draft?._id || props.published?._id
if (!rawId) return null

const id = rawId.replace(/^drafts\./, '')   // ← strips “drafts.” if present

  /* 4 ▸ action definition */
  return {
    label   : 'Open editor',
    icon    : EditIcon,
    shortcut: 'Ctrl+Shift+E',
    showAsAction: 'button',
    onHandle: () => {
      /* Built-in autosave already wrote recent edits to the draft,
         so we can safely open the editor right away. */

      window.open(`${FRONTEND_BASE}/admin/templates/${id}`, '_blank')

      toast.push({status: 'success', title: 'Editor opened in new tab'})
      props.onComplete()
    },
  }
}

export default cardEditorAction