import { UserSummary } from '../../ui/entities/user';

export default function UserSummaryButton({
  entity,
  access,
  onClick,
  compact = false,
}) {
  if (!entity || !access) return null;
  return <UserSummary model={entity} access={access} onClick={onClick} compact={compact} />;
}
