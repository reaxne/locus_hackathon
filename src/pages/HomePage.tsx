import { ArrowRight, ArrowUpRight} from 'lucide-react'
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
            Твоё будущее.
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
    </>
  )
}
