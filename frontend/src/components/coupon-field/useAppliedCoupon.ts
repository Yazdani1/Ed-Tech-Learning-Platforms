'use client';

import { useEffect, useRef, useState } from 'react';

import { useCheckCoupon } from '@/api/coupons.api';
import { priceInfo, type PriceInfo } from '@/utils/price';

import type { Course } from '@/schemas/browse.schema';
import type { CourseOffer } from '@/schemas/coupon.schema';
import type { ApiError } from '@/services/http.service';

/** The code chosen on the course page is remembered for its payment page ('' = the buyer removed it). */
const storageKey = (courseId: string): string => `coupon:${courseId}`;

const readStored = (courseId: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(storageKey(courseId));
  } catch {
    return null;
  }
};

const store = (courseId: string, code: string | null): void => {
  try {
    if (code === null) window.sessionStorage.removeItem(storageKey(courseId));
    else window.sessionStorage.setItem(storageKey(courseId), code);
  } catch {
    // Private mode or blocked storage: the payment page then starts from the course's own offer again
  }
};

export interface AppliedCoupon {
  /** The code in use (null = none: the list price) */
  applied: CourseOffer | null;
  /** The course price with the applied code */
  price: PriceInfo;
  apply: (code: string) => void;
  /** The buyer removed the code: the list price (remembered for the payment page) */
  remove: () => void;
  /** The code's time ran out: no code, and a later offer may be filled in again */
  expire: () => void;
  checking: boolean;
  error: ApiError | null;
}

const listPriceOf = (course: Course): number => Math.max(course.listPrice ?? course.price ?? 0, 0);

/** The starting code: removed (''), or the course's offer (another stored code is checked after mount). */
const initialCoupon = (course: Course): CourseOffer | null =>
  readStored(course._id) === '' ? null : (course.offer ?? null);

/**
 * One coupon per order: starts with the course's best running offer (its own discount or a promo), or the
 * code chosen before on this browser tab; the buyer can remove it (list price) or apply another code (checked
 * on the server, which checks it again at enrolment).
 */
export const useAppliedCoupon = (course: Course): AppliedCoupon => {
  const [applied, setApplied] = useState<CourseOffer | null>(() => initialCoupon(course));
  const check = useCheckCoupon(course._id);
  const { mutateAsync: checkCode } = check;
  // The buyer's own action wins over the stored code that is still being checked
  const touched = useRef(false);

  useEffect(() => {
    const stored = readStored(course._id);
    if (!stored || stored === course.offer?.code) return;
    checkCode(stored)
      .then((offer) => {
        if (!touched.current) setApplied(offer);
      })
      .catch(() => {
        store(course._id, null);
      });
  }, [course._id, course.offer?.code, checkCode]);

  const listPrice = listPriceOf(course);
  return {
    applied,
    price: priceInfo(listPrice, applied ? applied.price : listPrice),
    apply: (code) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      touched.current = true;
      check.mutate(trimmed, {
        onSuccess: (offer) => {
          setApplied(offer);
          store(course._id, offer.code);
        },
      });
    },
    remove: () => {
      touched.current = true;
      setApplied(null);
      check.reset();
      store(course._id, '');
    },
    expire: () => {
      setApplied(null);
      store(course._id, null);
    },
    checking: check.isPending,
    error: check.error,
  };
};
