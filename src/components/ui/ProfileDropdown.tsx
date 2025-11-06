interface ProfileDropdownProps {
  onViewProfile: () => void;
  onLogout: () => void;
}

export default function ProfileDropdown({ onViewProfile, onLogout }: ProfileDropdownProps) {
  return (
    <div className="profileDropdownMenu">
      <button
        onClick={onViewProfile}
        className="profileDropdownButton"
      >
        View Profile
      </button>
      <button
        onClick={onLogout}
        className="profileDropdownButton"
      >
        Logout
      </button>
    </div>
  );
}

