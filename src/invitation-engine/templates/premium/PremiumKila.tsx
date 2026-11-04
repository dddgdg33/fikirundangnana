import TemplateFrame from '../TemplateFrame'
import type { InvitationTemplateProps } from '@/invitation-engine/types'

export default function PremiumKila(props: InvitationTemplateProps) {
  return <TemplateFrame {...props} slug='premium-kila' title='Premium Kila' />
}
