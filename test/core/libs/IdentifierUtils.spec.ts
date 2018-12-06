import IdentifierUtils from '@/core/libs/IdentifierUtils';

const identifierUtils = new IdentifierUtils();

test('should support CJK', () => {
  expect(identifierUtils.transform('中文')).toBe('中文');
  expect(identifierUtils.transform('ぅりーうえん')).toBe('ぅりーうえん');
  expect(identifierUtils.transform('한국어')).toBe('한국어');
});
