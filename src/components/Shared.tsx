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
// Line art, not pictures: one stroke weight, currentColor, so both themes and any accent hold up.
const artwork = {
  survey: (
    <>
      <rect x="20" y="8" width="56" height="72" rx="8" />
      <circle cx="34" cy="30" r="4" opacity="0.45" />
      <path d="M46 30h18" opacity="0.45" />
      <circle cx="34" cy="46" r="4" fill="currentColor" stroke="none" />
      <path d="M46 46h18" opacity="0.45" />
      <circle cx="34" cy="62" r="4" opacity="0.45" />
      <path d="M46 62h12" opacity="0.45" />
    </>
  ),
  programs: (
    <>
      <rect x="6" y="20" width="36" height="56" rx="8" opacity="0.45" />
      <rect x="54" y="20" width="36" height="56" rx="8" opacity="0.45" />
      <path d="M16 36h16M16 48h12M64 36h16M64 48h12" opacity="0.45" />
      <circle cx="48" cy="14" r="6" strokeWidth="2.5" />
      <path d="M48 20v56" strokeWidth="2.5" />
    </>
  ),
  list: (
    <>
      <rect x="14" y="10" width="68" height="60" rx="8" opacity="0.45" />
      <path d="M28 28h40M28 42h40M28 56h24" opacity="0.45" />
      <circle cx="70" cy="62" r="16" fill="var(--surface)" />
      <path d="M70 55v14M63 62h14" strokeWidth="2.5" />
    </>
  ),
} as const
export type EmptyArt = keyof typeof artwork

export function Empty({
  title,
  children,
  href = '/diagnosis',
  action = 'Заполнить анкету',
  art,
}: {
  title: string
  children: ReactNode
  href?: string
  action?: string
  art?: EmptyArt
}) {
  return (
    <section className="empty panel">
      <div className="empty-icon">
        {art ? (
          <svg
            className="empty-art"
            viewBox="0 0 96 88"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {artwork[art]}
          </svg>
        ) : (
          <Info />
        )}
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
