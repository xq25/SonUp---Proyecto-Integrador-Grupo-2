import './RoleCard.css'

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#176D65" />
    <polyline
      points="6,12 10,16 18,8"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const DotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8" fill="#173632" />
  </svg>
)

const RoleCard = ({ role, isSelected, onSelect }) => (
  <button
    type="button"
    className={`role-card${isSelected ? ' role-card--selected' : ''}`}
    onClick={onSelect}
    aria-pressed={isSelected}
  >
    <span className="role-card__indicator">
      {isSelected ? <CheckIcon /> : <DotIcon />}
    </span>
    <span className="role-card__icon">{role.icon}</span>
    <span className="role-card__label">{role.label}</span>
    <span className="role-card__desc">{role.description}</span>
  </button>
)

export default RoleCard
