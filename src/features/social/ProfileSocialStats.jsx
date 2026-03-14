function ProfileSocialStats({ supporterCount = 0, supportingCount = 0, crewCount = 0 }) {
  const items = [
    { label: '응원받음', value: supporterCount },
    { label: '응원함', value: supportingCount },
    { label: '크루', value: crewCount },
  ]

  return (
    <div className="profile-social-stats" aria-label="profile social stats">
      {items.map((item) => (
        <div key={item.label} className="profile-social-stat">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default ProfileSocialStats
