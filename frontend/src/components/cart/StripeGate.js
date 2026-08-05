import { lazy, Suspense } from 'react';
import Loader from '../layouts/Loader';

const Payment = lazy(() => import('./Payment'));

export default function StripeGate() {
  return (
    <Suspense fallback={<Loader />}>
      <Payment />
    </Suspense>
  );
}
