import { SubscriptionInterval } from "../../../generated/prisma/client.js";

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  const targetMonthStart = new Date(
    Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth() + months,
      1,
      result.getUTCHours(),
      result.getUTCMinutes(),
      result.getUTCSeconds(),
      result.getUTCMilliseconds(),
    ),
  );
  targetMonthStart.setUTCDate(
    Math.min(
      originalDay,
      daysInUtcMonth(
        targetMonthStart.getUTCFullYear(),
        targetMonthStart.getUTCMonth(),
      ),
    ),
  );
  return targetMonthStart;
}

function addCalendarYears(date: Date, years: number): Date {
  const result = new Date(date);
  const originalMonth = result.getUTCMonth();
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  result.setUTCMonth(originalMonth);
  result.setUTCDate(
    Math.min(
      originalDay,
      daysInUtcMonth(result.getUTCFullYear(), originalMonth),
    ),
  );
  return result;
}

export function addPlanDuration(
  startsAt: Date,
  interval: SubscriptionInterval,
  intervalCount: number,
): Date {
  if (!Number.isInteger(intervalCount) || intervalCount < 1) {
    throw new Error("Subscription interval count must be a positive integer");
  }

  if (interval === SubscriptionInterval.WEEK) {
    const result = new Date(startsAt);
    result.setUTCDate(result.getUTCDate() + 7 * intervalCount);
    return result;
  }

  if (interval === SubscriptionInterval.MONTH) {
    return addCalendarMonths(startsAt, intervalCount);
  }

  return addCalendarYears(startsAt, intervalCount);
}
