import { ReviewScreen } from "@/features/review/components/review-screen"

// The layout renders this only after the underwriting loads (client query).
export const instant = false

export default function ReviewPage() {
  return <ReviewScreen />
}
