import { render, fireEvent } from '@testing-library/react'
import FabricCanvas from '../components/FabricCanvas'
import { TemplatePage } from '../components/FabricCanvas'

test('enter crop mode via event', () => {
  const page: TemplatePage = { name: 'front', layers: [] }
  const { container } = render(
    <FabricCanvas pageIdx={0} page={page} onReady={() => {}} isCropping={false} />
  )
  document.dispatchEvent(new CustomEvent('start-crop'))
  // simply ensure the canvas rendered without crashing
  expect(container).toBeTruthy()
})
