import type {DocumentActionComponent} from 'sanity'
import {useToast} from '@sanity/ui'

const SaveDraftAction: DocumentActionComponent = () => {
  const toast = useToast()

  return {
    label   : 'Save draft',
    tone    : 'positive',
    shortcut: 'Ctrl+S',
    showAsAction: 'button',          // ← makes it bottom-row
    onHandle: () => {
      toast.push({title: 'Draft saved!', status: 'success'})
    },
  }
}

export default SaveDraftAction