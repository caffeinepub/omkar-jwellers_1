import type { Lang } from "../translations";

const onesEn = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tensEn = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const onesMr = [
  "",
  "एक",
  "दोन",
  "तीन",
  "चार",
  "पाच",
  "सहा",
  "सात",
  "आठ",
  "नऊ",
  "दहा",
  "अकरा",
  "बारा",
  "तेरा",
  "चौदा",
  "पंधरा",
  "सोळा",
  "सतरा",
  "अठरा",
  "एकोणीस",
];
const tensMr = [
  "",
  "",
  "वीस",
  "तीस",
  "चाळीस",
  "पन्नास",
  "साठ",
  "सत्तर",
  "ऐंशी",
  "नव्वद",
];

function twoDigitsEn(n: number): string {
  if (n < 20) return onesEn[n];
  const rem = n % 10;
  return rem !== 0
    ? `${tensEn[Math.floor(n / 10)]} ${onesEn[rem]}`
    : tensEn[Math.floor(n / 10)];
}

function threeDigitsEn(n: number): string {
  if (n >= 100) {
    const rem = n % 100;
    return rem !== 0
      ? `${onesEn[Math.floor(n / 100)]} Hundred ${twoDigitsEn(rem)}`
      : `${onesEn[Math.floor(n / 100)]} Hundred`;
  }
  return twoDigitsEn(n);
}

function twoDigitsMr(n: number): string {
  if (n < 20) return onesMr[n];
  const rem = n % 10;
  return rem !== 0
    ? `${tensMr[Math.floor(n / 10)]} ${onesMr[rem]}`
    : tensMr[Math.floor(n / 10)];
}

function threeDigitsMr(n: number): string {
  if (n >= 100) {
    const rem = n % 100;
    return rem !== 0
      ? `${onesMr[Math.floor(n / 100)]} शे ${twoDigitsMr(rem)}`
      : `${onesMr[Math.floor(n / 100)]} शे`;
  }
  return twoDigitsMr(n);
}

export function numberToWordsEn(amount: number): string {
  const n = Math.floor(amount);
  if (n === 0) return "Rupees Zero Only";

  let result = "";
  let rem = n;

  if (rem >= 10000000) {
    result += `${threeDigitsEn(Math.floor(rem / 10000000))} Crore `;
    rem %= 10000000;
  }
  if (rem >= 100000) {
    result += `${threeDigitsEn(Math.floor(rem / 100000))} Lakh `;
    rem %= 100000;
  }
  if (rem >= 1000) {
    result += `${threeDigitsEn(Math.floor(rem / 1000))} Thousand `;
    rem %= 1000;
  }
  if (rem > 0) {
    result += `${threeDigitsEn(rem)} `;
  }

  return `Rupees ${result.trim()} Only`;
}

export function numberToWordsMr(amount: number): string {
  const n = Math.floor(amount);
  if (n === 0) return "रुपये शून्य फक्त";

  let result = "";
  let rem = n;

  if (rem >= 10000000) {
    result += `${threeDigitsMr(Math.floor(rem / 10000000))} कोटी `;
    rem %= 10000000;
  }
  if (rem >= 100000) {
    result += `${threeDigitsMr(Math.floor(rem / 100000))} लाख `;
    rem %= 100000;
  }
  if (rem >= 1000) {
    result += `${threeDigitsMr(Math.floor(rem / 1000))} हजार `;
    rem %= 1000;
  }
  if (rem > 0) {
    result += `${threeDigitsMr(rem)} `;
  }

  return `रुपये ${result.trim()} फक्त`;
}

export function numberToWords(amount: number, lang: Lang): string {
  return lang === "mr" ? numberToWordsMr(amount) : numberToWordsEn(amount);
}
