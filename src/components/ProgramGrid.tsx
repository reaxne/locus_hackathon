import { type Profile, type Recommendation, type University } from '../model'
import ProgramCard from './ProgramCard'

export default function ProgramGrid({
  items,
  profile,
  comparison,
  toggleCompare,
  setDetails,
}: {
  items: Recommendation[]
  profile: Profile
  comparison: string[]
  toggleCompare: (id: string) => void
  setDetails: (university: University) => void
}) {
  return (
    <div className="program-grid">
      {items.map((item) => (
        <ProgramCard
          key={item.university.id}
          item={item}
          profile={profile}
          selected={comparison.includes(item.university.id)}
          toggle={() => toggleCompare(item.university.id)}
          details={() => setDetails(item.university)}
        />
      ))}
    </div>
  )
}
