import { ArrowLeft, ArrowRight, ExternalLink, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ApplicantProfile, SourcedFact } from '../types'
import { factApplies } from '../data/universities'
import { Link } from '../lib/router'

export function PageHeading({
  eyebrow,
  title,
  description,
  back,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  back?: string
  children?: ReactNode
}) {
  return (
    <div className="page-heading">
      {back && (
        <Link className="back-link" href={back}>
          <ArrowLeft size={15} /> Назад
        </Link>
      )}
      <div className="eyebrow">{eyebrow}</div>
      <div className="heading-row">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
export function External({
  href,
  children,
  className = '',
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  if (!href) return <span className={`external ${className}`}>Источник не указан</span>
  return (
    <a className={`external ${className}`} href={href} target="_blank" rel="noreferrer">
      {children}
      <ExternalLink size={13} aria-hidden="true" />
      <span className="sr-only"> (откроется в новой вкладке)</span>
    </a>
  )
}
export function Fact<T>({
  fact,
  profile,
  format = String,
}: {
  fact: SourcedFact<T>
  profile?: ApplicantProfile
  format?: (value: T) => string
}) {
  const applicable = factApplies(fact, profile)
  return (
    <div className="fact">
      <span className={applicable ? '' : 'muted'}>
        {applicable
          ? format(fact.value!)
          : fact.status === 'demo' && fact.value !== null
            ? `${format(fact.value)} · Пример`
            : 'Уточните на официальном сайте'}
      </span>
      <small>
        {applicable
          ? `Подтверждено${fact.admissionCycle ? ` · ${fact.admissionCycle}` : ''}`
          : 'Не подтверждено для вашего года поступления'}
        {fact.verifiedAt && ` · Проверено ${fact.verifiedAt}`}
      </small>
      {!applicable && fact.status === 'verified' && fact.admissionCycle && (
        <small>
          Данные прошлых лет: {format(fact.value!)} · {fact.admissionCycle}. Не подтверждают цену или правила
          для вашего года и категории поступления.
        </small>
      )}
      <External href={fact.sourceUrl}>Официальный источник</External>
    </div>
  )
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="info-note">
      <Info size={18} />
      <div>{children}</div>
    </div>
  )
}
export function Empty({
  title,
  children,
  href = '/diagnosis',
  action = 'Заполнить анкету',
}: {
  title: string
  children: ReactNode
  href?: string
  action?: string
}) {
  return (
    <section className="empty panel">
      <div className="empty-icon">
        <Info />
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      <Link className="button primary" href={href}>
        {action}
        <ArrowRight size={16} />
      </Link>
    </section>
  )
}
