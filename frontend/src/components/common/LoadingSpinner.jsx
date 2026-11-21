export default function LoadingSpinner({ message = '불러오는 중...' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      <span className="loading__text">{message}</span>
    </div>
  )
}
