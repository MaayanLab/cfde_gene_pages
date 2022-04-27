import dynamic from 'next/dynamic'

const BootstrapTooltip = dynamic(() => import('@/components/BootstrapTooltip'), { ssr: false })

export default function VariantInfo({ variant, gene, description }) {
  return (
    <div className="col-12 justify-content-center">
      <p>
          The variant <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{variant}</span> was converted to a gene <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{gene}</span> using dbSNP&nbsp;<BootstrapTooltip title={description} />
      </p>
    </div>
  )
}
