import { Link } from 'react-router-dom'
import { useTitle } from '../useTitle'

export function Missing() {
  useTitle('পাওয়া যায়নি')
  return (
    <div className="wrap page missing">
      <p className="eyebrow">৪০৪</p>
      <h1>এই পৃষ্ঠা নেই</h1>
      <p className="lede">অধ্যায়ের ঠিকানা মিলছে না। হোম থেকে আবার বেছে নাও।</p>
      <Link className="btn btn-primary" to="/">
        হোমে ফিরে যাও
      </Link>
    </div>
  )
}
