import dynamic from 'next/dynamic'

const PDBeMolstarPluginContext = dynamic(() => import('@/components/PDBeMolstarWidget').then(({ PDBeMolstarPluginContext }) => PDBeMolstarPluginContext))
const PDBeMolstarWidget = dynamic(() => import('@/components/PDBeMolstarWidget'))

export default function Test() {
  return (
    <PDBeMolstarPluginContext>
      <PDBeMolstarWidget
        style={{ minHeight: 500 }}
        options={{ moleculeId: '2nnu', hideControls: true }}
      />
    </PDBeMolstarPluginContext>
  )
}