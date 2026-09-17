import { ArrowRight, ArrowUpRight, Check, Fingerprint, ListChecks, Search, ShieldCheck } from 'lucide-react'
import { Link } from '../lib/router'
import type { Admission } from '../hooks/useAdmission'

export default function HomePage(_props: { admission: Admission }) {
  return (
    <>
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="eyebrow">
            <span className="status-dot" /> ДЛЯ УЧЕНИКОВ 9–12 КЛАССОВ
          </div>
          <h1>
            Твоё будущее в IT.
            <br />
            <span>Твой маршрут.</span>
          </h1>
          <p>
            От первых интересов до поступления в университет Казахстана. Найди подходящие программы и преврати
            большую цель в понятные шаги.
          </p>
          <div className="hero-actions">
            <Link className="button primary large" href="/register">
              Создать аккаунт <ArrowRight size={19} />
            </Link>
            <Link className="button secondary large" href="/sign-in">
              Войти <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="hero-assurance">
            <span>
              <Check size={15} /> Под твои интересы и бюджет
            </span>
            <span>
              <Check size={15} /> В твоём темпе
            </span>
          </div>
        </div>
        <div
          className="landing-map"
          aria-label="Пример маршрута: профиль, программы, подготовка, поступление"
        >
          <div className="landing-map-heading">
            <span className="small-label">ОТ ТОЧКИ А К ТВОЕЙ ЦЕЛИ</span>
            <span className="pill">Пример</span>
          </div>
          <div className="landing-map-line" aria-hidden="true" />
          <div className="map-stop stop-one">
            <span>01</span>
            <div>
              <small>НАЧАЛО</small>
              <strong>Твои интересы</strong>
            </div>
          </div>
          <div className="map-stop stop-two">
            <span>02</span>
            <div>
              <small>ВЫБОР</small>
              <strong>Твои университеты</strong>
            </div>
          </div>
          <div className="map-stop stop-three">
            <span>03</span>
            <div>
              <small>ДЕЙСТВИЕ</small>
              <strong>Твоя подготовка</strong>
            </div>
          </div>
          <div className="map-destination">
            <ArrowUpRight size={25} />
            <span>
              Следующая остановка —<br />
              <strong>поступление.</strong>
            </span>
          </div>
        </div>
      </section>
      <section className="journey-overview" aria-labelledby="journey-title">
        <div className="section-intro">
          <div>
            <div className="eyebrow">КАК ЭТО РАБОТАЕТ</div>
            <h2 id="journey-title">
              Не всё сразу.
              <br />
              Один шаг за другим.
            </h2>
          </div>
          <p>
            Ты выбираешь направление.
            <br />
            Мы помогаем увидеть следующий шаг.
          </p>
        </div>
        <div className="feature-grid">
          {[
            {
              icon: Fingerprint,
              title: 'Короткая анкета',
              text: 'Расскажи об интересах, классе, бюджете и планах. По одному вопросу за раз.',
              label: '01 / АНКЕТА',
            },
            {
              icon: Search,
              title: 'Анализ профиля',
              text: 'Сопоставим ответы с программами и объясним, почему стоит рассмотреть каждую.',
              label: '02 / АНАЛИЗ',
            },
            {
              icon: ShieldCheck,
              title: 'Подходящие университеты',
              text: 'Сравни программы, сохрани варианты и проверь требования по официальным источникам.',
              label: '03 / ВЫБОР',
            },
            {
              icon: ListChecks,
              title: 'Личный план',
              text: 'Экзамены, проекты и документы — в одном маршруте с конкретными действиями.',
              label: '04 / МАРШРУТ',
            },
          ].map(({ icon: Icon, title, text, label }) => (
            <article className="feature" key={title}>
              <div className="feature-top">
                <Icon size={23} />
                <span>{label}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="transparency-strip">
        <div>
          <ShieldCheck size={24} />
          <div>
            <strong>Решения — твои. Источники — открытые.</strong>
            <p>
              Показываем подтверждённые факты и честно отмечаем, что нужно уточнить. Подбор не гарантирует
              поступление.
            </p>
          </div>
        </div>
        <Link href="/sources">
          О наших данных <ArrowRight size={17} />
        </Link>
      </section>
      <section className="landing-bottom">
        <div>
          <span className="eyebrow">НАЧНИ С СЕБЯ</span>
          <h2>
            Большая цель.
            <br />
            Первый простой шаг.
          </h2>
        </div>
        <Link className="button primary large" href="/register">
          Создать аккаунт <ArrowRight size={19} />
        </Link>
      </section>
    </>
  )
}
