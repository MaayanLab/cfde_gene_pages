import dynamic from 'next/dynamic'

const BootstrapTooltip = dynamic(() => import('@/components/BootstrapTooltip'), { ssr: false })

export default function VariantInfo({ variant, gene, description }) {
  return (
    <div className="col-12 justify-content-center">
      <p>
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
          The variant was converted to a gene {gene} using dbSNP&nbsp;<BootstrapTooltip title={description} />
        </span>
      </p>
    </div>
  )
}
