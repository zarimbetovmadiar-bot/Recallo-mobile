// Tests for date helpers and the clock (plan section "Testing", T5).
import { addDays, daysBetween, dateRange, isValidDateString, relativeDays, toLocalDateString, formatDay } from '../dates';
import { today, setDemoOffset, getDemoOffset } from '../clock';

describe('dates', () => {
  test('T5.1 addDays crosses months, years and leap days', () => {
    expect(addDays('2026-01-30', 6)).toBe('2026-02-05');
    expect(addDays('2026-12-29', 6)).toBe('2027-01-04');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('T5.2 daysBetween', () => {
    expect(daysBetween('2026-12-01', '2026-12-11')).toBe(10);
    expect(daysBetween('2026-12-11', '2026-12-01')).toBe(-10);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });

  test('T5.3 local day of a Date: 02:00 on 1 Dec is still 1 Dec', () => {
    // new Date(y, m, d, h) is built in local time, like the phone's clock.
    expect(toLocalDateString(new Date(2026, 11, 1, 2, 0))).toBe('2026-12-01');
    expect(toLocalDateString(new Date(2026, 11, 1, 23, 59))).toBe('2026-12-01');
  });

  test('dateRange includes both ends', () => {
    expect(dateRange('2026-12-30', '2027-01-02')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
    expect(dateRange('2026-12-02', '2026-12-01')).toEqual([]);
  });

  test('isValidDateString', () => {
    expect(isValidDateString('2026-02-28')).toBe(true);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-2-3')).toBe(false);
  });

  test('human-readable labels', () => {
    expect(relativeDays('2026-12-01', '2026-12-01')).toBe('today');
    expect(relativeDays('2026-12-01', '2026-12-02')).toBe('tomorrow');
    expect(relativeDays('2026-12-01', '2026-12-07')).toBe('in 6 days');
    expect(relativeDays('2026-12-03', '2026-12-01')).toBe('2 days ago');
    expect(formatDay('2026-12-01')).toBe('Tue, 1 Dec');
  });
});

describe('clock', () => {
  afterEach(() => setDemoOffset(0));

  test('T5.4 demo offset moves "today" but not the real date', () => {
    const real = toLocalDateString(new Date());
    setDemoOffset(6);
    expect(getDemoOffset()).toBe(6);
    expect(today()).toBe(addDays(real, 6));
    setDemoOffset(0);
    expect(today()).toBe(real);
  });

  test('offset must be a whole number', () => {
    expect(() => setDemoOffset(1.5)).toThrow();
  });
});
