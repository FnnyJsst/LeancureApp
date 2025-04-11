export const Buffer = {
  from: jest.fn((content, encoding) => ({
    toString: jest.fn(() => {
      if (encoding === 'base64') {
        return 'mocked-decoded-content';
      }
      return 'mocked-string-content';
    })
  }))
};